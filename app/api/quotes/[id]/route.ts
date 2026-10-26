
import { NextResponse } from "next/server"
import type { QuoteRequest } from "@/lib/mock-data"
import { readCollection } from "@/lib/demo-store"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const quotes = await readCollection<QuoteRequest>("quotes")
    const quote = quotes.find(
      (item) => item.id === id || item.quoteNumber === id,
    )

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found." },
        { status: 404 },
      )
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error("Failed to load quote:", error)
    return NextResponse.json(
      { error: "Failed to load quote." },
      { status: 500 },
    )
  }
}
