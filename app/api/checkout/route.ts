
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getProductById } from "@/lib/catalogue"
import { VAT_RATE } from "@/lib/constants"
import type { Order } from "@/lib/mock-data"
import { readCollection, writeCollection } from "@/lib/demo-store"

export const runtime = "nodejs"

type StoredOrder = Order & {
  contactEmail: string
  contactName: string
  contactPhone: string
  billingAddress: string
}

type CheckoutBody = {
  items?: {
    productId: string
    quantity: number
    color: string
    size: string
  }[]
  billingAddress?: string
  shippingAddress?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
}

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 100
    ) {
      return NextResponse.json(
        { error: "Add at least one valid item to checkout." },
        { status: 400 },
      )
    }

    const contactName = text(body.contactName)
    const contactEmail = text(body.contactEmail).toLowerCase()
    const contactPhone = text(body.contactPhone)
    const billingAddress = text(body.billingAddress)
    const shippingAddress = text(body.shippingAddress)

    if (
      !contactName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ||
      !contactPhone ||
      !billingAddress ||
      !shippingAddress
    ) {
      return NextResponse.json(
        { error: "Complete all contact, billing and shipping fields." },
        { status: 400 },
      )
    }

    const orderItems: Order["items"] = []

    for (const item of body.items) {
      const productId = text(item?.productId)
      const color = text(item?.color)
      const size = text(item?.size)
      const quantity = item?.quantity

      if (
        !productId ||
        !color ||
        !size ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100000
      ) {
        return NextResponse.json(
          { error: "An item has invalid product, variant or quantity details." },
          { status: 400 },
        )
      }

      const product = await getProductById(productId)

      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} was not found.` },
          { status: 400 },
        )
      }

      const variant = product.variants.find(
        (v) =>
          v.color.toLowerCase() === color.toLowerCase() &&
          v.size.toLowerCase() === size.toLowerCase(),
      )

      if (!variant) {
        return NextResponse.json(
          { error: `The selected colour and size are unavailable for ${product.name}.` },
          { status: 400 },
        )
      }

      if (quantity < product.minOrderQty) {
        return NextResponse.json(
          { error: `${product.name} requires a minimum order quantity of ${product.minOrderQty}.` },
          { status: 400 },
        )
      }

      if (variant.stock < quantity) {
        return NextResponse.json(
          { error: `Insufficient current stock for ${product.name} (${color}, ${size}). Available: ${variant.stock}.` },
          { status: 409 },
        )
      }

      if (!Number.isFinite(variant.price) || variant.price <= 0) {
        return NextResponse.json(
          { error: `A valid price is unavailable for ${product.name}.` },
          { status: 409 },
        )
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        sku: variant.fullCode,
        quantity,
        color: variant.color,
        size: variant.size,
        unitPrice: variant.price,
      })
    }

    const subtotal = Number(
      orderItems
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
        .toFixed(2),
    )
    const vat = Number((subtotal * VAT_RATE).toFixed(2))
    const total = Number((subtotal + vat).toFixed(2))
    const id = randomUUID()
    const year = new Date().getFullYear()

    const order: StoredOrder = {
      id,
      orderNumber: `LNR-${year}-${id.slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      status: "Pending",
      items: orderItems,
      subtotal,
      vat,
      total,
      shippingAddress,
      contactEmail,
      contactName,
      contactPhone,
      billingAddress,
    }

    const orders = await readCollection<StoredOrder>("orders")
    orders.push(order)
    await writeCollection("orders", orders)

    return NextResponse.json(
      {
        success: true,
        orderNumber: order.orderNumber,
        order,
        message: "Order saved successfully. Payment is not yet processed.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Checkout failed:", error)

    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 },
    )
  }
}
