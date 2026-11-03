import { NextResponse } from "next/server"
import { getProductStock } from "@/lib/catalogue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Amrod can take a while on a fresh server; give it time.
export const maxDuration = 60

/**
 * Live stock for one product: every colour and size, with incoming stock.
 * No prices, so it is safe to show to visitors who aren't signed in.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params

  try {
    const stock = await getProductStock(productId)
    if (!stock) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 })
    }
    return NextResponse.json(stock, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Failed to load stock:", error)
    return NextResponse.json(
      { error: "Stock is temporarily unavailable." },
      { status: 503 },
    )
  }
}
