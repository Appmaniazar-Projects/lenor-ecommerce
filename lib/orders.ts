import { z } from "zod"
import { getProductById } from "@/lib/catalogue"
import { readAll, update } from "@/lib/store"
import { VAT_RATE } from "@/lib/constants"
import type { Order, OrderItem, QuoteRequest } from "@/lib/mock-data"

/** Thrown for problems the customer can fix (shown as a 4xx with a clear message). */
export class OrderValidationError extends Error {
  constructor(
    message: string,
    public status: 400 | 409 = 400
  ) {
    super(message)
    this.name = "OrderValidationError"
  }
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        color: z.string().min(1),
        size: z.string().min(1),
        quantity: z.number().int().min(1).max(1_000_000),
      })
    )
    .min(1, "Your cart is empty"),
  contactName: z.string().trim().min(2),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().min(10),
  billingAddress: z.string().trim().min(10),
  shippingAddress: z.string().trim().min(10),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

function nextNumber(prefix: string, existing: { id: string }[], year: number) {
  const seq =
    existing.reduce((max, item) => {
      const n = Number(item.id.split("-").pop())
      return Number.isFinite(n) ? Math.max(max, n) : max
    }, 0) + 1

  const padded = String(seq).padStart(4, "0")
  return { id: `${prefix}-${padded}`, number: `${year}-${padded}` }
}

/**
 * Builds an order from what the customer picked, but takes name, price and
 * stock from the live Amrod catalogue. Prices sent by the browser are ignored.
 */
export async function createOrder(input: CheckoutInput): Promise<Order> {
  const lines: OrderItem[] = []

  for (const item of input.items) {
    const product = await getProductById(item.productId)

    if (!product) {
      throw new OrderValidationError(
        `A product in your cart (${item.productId}) is no longer available.`
      )
    }

    const variant = product.variants.find(
      (v) => v.color === item.color && v.size === item.size
    )

    if (!variant) {
      throw new OrderValidationError(
        `${product.name} is not available in ${item.color} / ${item.size}.`
      )
    }

    if (variant.price <= 0) {
      throw new OrderValidationError(
        `${product.name} (${item.color}, ${item.size}) has no price right now. Please request a quote instead.`
      )
    }

    if (item.quantity < product.minOrderQty) {
      throw new OrderValidationError(
        `${product.name}: the minimum order is ${product.minOrderQty} units.`
      )
    }

    if (item.quantity > variant.stock) {
      throw new OrderValidationError(
        `${product.name} (${item.color}, ${item.size}): only ${variant.stock} in stock.`,
        409
      )
    }

    lines.push({
      productId: product.id,
      productName: product.name,
      sku: variant.fullCode,
      fullCode: variant.fullCode,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      unitPrice: round2(variant.price),
    })
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
  const vat = round2(subtotal * VAT_RATE)
  const year = new Date().getFullYear()

  return update<Order, Order>("orders", (orders) => {
    const { id, number } = nextNumber("ord", orders, year)

    const order: Order = {
      id,
      orderNumber: `LNR-${number}`,
      date: new Date().toISOString(),
      status: "Pending",
      paymentStatus: "unpaid",
      items: lines,
      subtotal,
      vat,
      total: round2(subtotal + vat),
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    }

    return { items: [order, ...orders], result: order }
  })
}

const sameEmail = (a?: string, b?: string) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase())

export async function listOrders(email?: string): Promise<Order[]> {
  const orders = await readAll<Order>("orders")
  return (email ? orders.filter((o) => sameEmail(o.contactEmail, email)) : orders)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function findOrder(id: string): Promise<Order | null> {
  return (await readAll<Order>("orders")).find((o) => o.id === id) ?? null
}

/* ------------------------------------------------------------------ */
/*  Quotes                                                             */
/* ------------------------------------------------------------------ */

export const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        color: z.string().min(1),
        size: z.string().min(1),
        quantity: z.number().int().min(1).max(1_000_000),
        brandingNotes: z.string().max(1000).default(""),
        brandingPosition: z.string().max(200).default(""),
      })
    )
    .min(1, "Your quote basket is empty"),
  contactName: z.string().trim().min(2),
  contactEmail: z.string().trim().email(),
  companyName: z.string().trim().min(2),
  deadline: z.string().min(1),
  specialInstructions: z.string().max(4000).default(""),
})

export type QuoteInput = z.infer<typeof quoteSchema>

export async function createQuote(input: QuoteInput): Promise<QuoteRequest> {
  const items: QuoteRequest["items"] = []
  let estimated = 0
  let estimateComplete = true

  for (const item of input.items) {
    const product = await getProductById(item.productId)

    if (!product) {
      throw new OrderValidationError(
        `A product in your quote (${item.productId}) is no longer available.`
      )
    }

    const variant = product.variants.find(
      (v) => v.color === item.color && v.size === item.size
    )

    if (variant && variant.price > 0) {
      estimated += variant.price * item.quantity
    } else {
      estimateComplete = false
    }

    items.push({
      productId: product.id,
      productName: product.name,
      sku: variant?.fullCode ?? product.sku,
      fullCode: variant?.fullCode,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      brandingNotes: item.brandingNotes,
      brandingPosition: item.brandingPosition,
    })
  }

  const year = new Date().getFullYear()

  return update<QuoteRequest, QuoteRequest>("quotes", (quotes) => {
    const { id, number } = nextNumber("qr", quotes, year)

    const quote: QuoteRequest = {
      id,
      quoteNumber: `QR-${number}`,
      date: new Date().toISOString(),
      status: "Pending",
      items,
      deadline: input.deadline,
      specialInstructions: input.specialInstructions,
      // Product cost only. Branding is priced by the team when they reply.
      estimatedTotal: estimateComplete ? round2(estimated) : null,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      companyName: input.companyName,
    }

    return { items: [quote, ...quotes], result: quote }
  })
}

export async function listQuotes(email?: string): Promise<QuoteRequest[]> {
  const quotes = await readAll<QuoteRequest>("quotes")
  return (email ? quotes.filter((q) => sameEmail(q.contactEmail, email)) : quotes)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function findQuote(id: string): Promise<QuoteRequest | null> {
  return (await readAll<QuoteRequest>("quotes")).find((q) => q.id === id) ?? null
}
