import { NextResponse } from "next/server"
import { rebuildCatalogueNow } from "@/lib/catalogue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Refreshes the Amrod catalogue and saves the snapshot. Vercel calls this
 * daily (vercel.json) and sends `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  try {
    const products = await rebuildCatalogueNow()
    return NextResponse.json({ ok: true, products })
  } catch (error) {
    console.error("Lenor: scheduled catalogue refresh failed:", error)
    return NextResponse.json({ ok: false }, { status: 502 })
  }
}
