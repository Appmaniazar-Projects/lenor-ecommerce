import { NextResponse } from "next/server"
import { getAmrodPrices } from "@/lib/amrod"
import { getSessionUser } from "@/lib/auth"

export const runtime = "nodejs"

// Raw Amrod price list. Only for Lenor admins; customers get prices
// through /api/products once they sign in.
export async function GET() {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  try {
    return NextResponse.json(await getAmrodPrices())
  } catch (error) {
    console.error("Failed to fetch pricing from Amrod:", error)
    return NextResponse.json(
      { error: "Failed to fetch pricing from Amrod" },
      { status: 502 }
    )
  }
}
