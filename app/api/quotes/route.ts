
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getProductById } from "@/lib/catalogue"
import type { QuoteRequest } from "@/lib/mock-data"
import { readCollection, updateCollection } from "@/lib/demo-store"
import { findUpload } from "@/lib/uploads"
import {
  canView,
  publicRecord,
  sortNewestFirst,
  type StoredQuote,
} from "@/lib/records"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

const text = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to see your quote requests." },
      { status: 401 },
    )
  }

  try {
    const quotes = await readCollection<StoredQuote>("quotes")
    const visible = quotes.filter((quote) => canView(quote, user))
    return NextResponse.json(sortNewestFirst(visible).map(publicRecord))
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
    const user = await getSessionUser()
    const body = (await request.json().catch(() => ({}))) as QuoteBody

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

    const contactName = text(body.contactName, 120)
    const contactEmail = text(body.contactEmail, 200).toLowerCase()
    const companyName = text(body.companyName, 200)
    const deadline = text(body.deadline, 10)

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(Date.parse(deadline))) {
      return NextResponse.json(
        { error: "Choose the date you need the items by." },
        { status: 400 },
      )
    }

    const logoFileId = text(body.logoFileId, 64)
    const logo = logoFileId ? await findUpload(logoFileId) : null

    if (logoFileId && !logo) {
      return NextResponse.json(
        { error: "The uploaded logo could not be found. Please upload it again." },
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
        brandingNotes: text(item.brandingNotes, 1000),
        brandingPosition: text(item.brandingPosition, 120),
        brandingMethod: text(item.brandingMethod, 120) || undefined,
      })
    }

    const id = randomUUID()
    const year = new Date().getFullYear()

    const quote: StoredQuote = {
      id,
      quoteNumber: `QR-${year}-${id.slice(0, 8).toUpperCase()}`,
      date: new Date().toISOString(),
      status: "Pending",
      items: quoteItems,
      deadline,
      specialInstructions: text(body.specialInstructions, 2000),
      estimatedTotal: null,
      contactName,
      contactEmail,
      companyName,
      logoFileId: logo?.id,
      logoFileName: logo?.fileName,
      userId: user?.id ?? null,
    }

    await updateCollection<StoredQuote, void>("quotes", (quotes) => {
      quotes.push(quote)
    })

    return NextResponse.json(
      {
        success: true,
        quoteNumber: quote.quoteNumber,
        quote: publicRecord(quote),
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
