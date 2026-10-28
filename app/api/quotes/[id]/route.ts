import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { readCollection } from "@/lib/demo-store"
import { canView, publicRecord, type StoredQuote } from "@/lib/records"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to see this quote." }, { status: 401 })
  }

  try {
    const { id } = await params
    const quotes = await readCollection<StoredQuote>("quotes")
    const quote = quotes.find(
      (item) => item.id === id || item.quoteNumber === id,
    )

    if (!quote || !canView(quote, user)) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 })
    }

    return NextResponse.json(publicRecord(quote))
  } catch (error) {
    console.error("Failed to load quote:", error)
    return NextResponse.json({ error: "Failed to load quote." }, { status: 500 })
  }
}
