
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getProductById } from "@/lib/catalogue"
import type { QuoteRequest } from "@/lib/mock-data"
import { readCollection, writeCollection } from "@/lib/demo-store"

export const runtime = "nodejs"

type StoredQuote = QuoteRequest & {
  items: QuoteRequest["items"]
}

type QuoteBody = {
  items?: {
    productId: string
    quantity: number
    color: string
    size: string
    brandingNotes?: string
    brandingPosition?: string
    brandingMethod?: string
  }[]
  logoFileId?: string
  contactName?: string
  contactEmail?: string
  companyName?: string
  deadline?: string
  specialInstructions?: string
}

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")?.trim().toLowerCase()
    const quotes = await readCollection<StoredQuote>("quotes")

    return NextResponse.json(
      email
        ? quotes.filter((quote) => quote.contactEmail.toLowerCase() === email)
        : quotes,
    )
  } catch (error) {
    console.error("Failed to load quotes:", error)
    return NextResponse.json(
      { error: "Failed to load quotes." },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteBody

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 100
    ) {
      return NextResponse.json(
        { error: "Add at least one item to request a quote." },
        { status: 400 },
      )
    }

    const contactName = text(body.contactName)
    const contactEmail = text(body.contactEmail).toLowerCase()
    const companyName = text(body.companyName)

    if (
      !contactName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ||
      !companyName
    ) {
      return NextResponse.json(
        { error: "Contact name, a valid email and company name are required." },
        { status: 400 },
      )
    }

    const quoteItems: QuoteRequest["items"] = []

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
          { error: `The selected variant is unavailable for ${product.name}.` },
          { status: 400 },
        )
      }

      quoteItems.push({
        productId: product.id,
        productName: product.name,
        sku: variant.fullCode,
        quantity,
        color: variant.color,
        size: variant.size,
        brandingNotes: text(item.brandingNotes),
        brandingPosition: text(item.brandingPosition),
      })
    }

    const id = randomUUID()
    const year = new Date().getFullYear()

    const quote: QuoteRequest = {
      id,
      quoteNumber: `QR-${year}-${id.slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      status: "Pending",
      items: quoteItems,
      deadline: text(body.deadline),
      specialInstructions: text(body.specialInstructions),
      estimatedTotal: null,
      contactName,
      contactEmail,
      companyName,
      logoFileId: text(body.logoFileId) || undefined,
    }

    const quotes = await readCollection<QuoteRequest>("quotes")
    quotes.push(quote)
    await writeCollection("quotes", quotes)

    return NextResponse.json(
      {
        success: true,
        quoteNumber: quote.quoteNumber,
        quote,
        message: "Quote request saved successfully.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Quote submission failed:", error)
    return NextResponse.json(
      { error: "Quote submission failed. Please try again." },
      { status: 500 },
    )
  }
}
