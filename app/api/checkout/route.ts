
import { randomUUID } from "node:crypto"
import { after, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { notifyNewOrder } from "@/lib/notify"
import { getProductById } from "@/lib/catalogue"
import { VAT_RATE } from "@/lib/constants"
import type { Order } from "@/lib/mock-data"
import { updateCollection } from "@/lib/demo-store"
import { publicRecord, type StoredOrder } from "@/lib/records"

export const runtime = "nodejs"

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

const text = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

// Prices: excl. VAT from Amrod, rounded to cents at each step.
const round2 = (value: number) => Math.round(value * 100) / 100

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to place an order." },
        { status: 401 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as CheckoutBody

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

    const subtotal = round2(
      orderItems.reduce(
        (sum, item) => sum + round2(item.quantity * round2(item.unitPrice)),
        0,
      ),
    )
    const vat = round2(subtotal * VAT_RATE)
    const total = round2(subtotal + vat)
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
      userId: user.id,
    }

    await updateCollection<StoredOrder, void>("orders", (orders) => {
      orders.push(order)
    })

    after(() => notifyNewOrder(order))

    return NextResponse.json(
      {
        success: true,
        orderNumber: order.orderNumber,
        order: publicRecord(order),
        message: "Order saved. Payment is not taken online yet.",
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
