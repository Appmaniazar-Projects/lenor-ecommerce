
import { randomUUID } from "node:crypto"
import { after, NextResponse } from "next/server"
import { clientIp, getSessionUser } from "@/lib/auth"
import { notifyNewQuote } from "@/lib/notify"
import { getProductById } from "@/lib/catalogue"
import { methodsForColour, type BrandingChoice } from "@/lib/branding"
import type { QuoteRequest } from "@/lib/mock-data"
import { getStore } from "@/lib/store"
import { publicRecord, type StoredQuote } from "@/lib/records"


// Amrod can take a while on a fresh server; give it time.
export const maxDuration = 60

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
    branded?: boolean
    brandings?: { positionCode?: string; methodCode?: string }[]
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
    const quotes = await getStore().quotes.list(user.isAdmin ? null : user.id)
    return NextResponse.json(quotes.map(publicRecord))
  } catch (error) {
    console.error("Failed to load quotes:", error)
    return NextResponse.json(
      { error: "Failed to load quotes." },
      { status: 500 },
    )
  }
}

// Each quote emails the address typed into the form, so limit how many a
// single visitor can send (stops the form being used to spam people).
const recentQuotes = new Map<string, number[]>()
const QUOTE_LIMIT = 10
const QUOTE_WINDOW_MS = 60 * 60 * 1000

function tooManyQuotes(key: string): boolean {
  const now = Date.now()
  const times = (recentQuotes.get(key) ?? []).filter((t) => now - t < QUOTE_WINDOW_MS)
  recentQuotes.set(key, times)
  return times.length >= QUOTE_LIMIT
}

export async function POST(request: Request) {
  try {
    const ipKey = clientIp(request)
    if (tooManyQuotes(ipKey)) {
      return NextResponse.json(
        { error: "Too many quote requests. Please try again later or contact Lenor directly." },
        { status: 429 },
      )
    }

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
    const logo = logoFileId ? await getStore().uploads.get(logoFileId) : null

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

      // Branding: only positions and types Amrod lists for this colour.
      const brandings: BrandingChoice[] = []
      const requested = item.branded && Array.isArray(item.brandings) ? item.brandings : []

      for (const choice of requested.slice(0, 20)) {
        const position = product.branding.positions.find(
          (p) => p.code === text(choice?.positionCode, 64)
        )
        const method = position
          ? methodsForColour(position, variant.colourCode).find(
              (m) => m.code === text(choice?.methodCode, 64)
            )
          : undefined

        if (!position || !method) {
          return NextResponse.json(
            { error: `A branding option chosen for ${product.name} is no longer available. Please choose it again.` },
            { status: 400 },
          )
        }
        if (!brandings.some((b) => b.positionCode === position.code)) {
          brandings.push({
            positionCode: position.code,
            positionName: position.name,
            methodCode: method.code,
            methodName: method.name,
          })
        }
      }

      const missingRequired = brandings.length > 0
        ? product.branding.positions.filter(
            (p) =>
              p.required &&
              methodsForColour(p, variant.colourCode).length > 0 &&
              !brandings.some((b) => b.positionCode === p.code),
          )
        : []
      if (missingRequired.length > 0) {
        return NextResponse.json(
          { error: `${product.name} needs a branding type for ${missingRequired.map((p) => p.name).join(", ")}.` },
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
        brandingPosition:
          brandings.map((b) => b.positionName).join(", ") ||
          (item.branded ? text(item.brandingPosition, 120) : ""),
        brandingMethod: brandings.map((b) => b.methodName).join(", ") || undefined,
        brandings,
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

    await getStore().quotes.insert(quote)
    recentQuotes.get(ipKey)?.push(Date.now())

    // Sent after the response so the customer doesn't wait for email.
    after(() => notifyNewQuote(quote))

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
