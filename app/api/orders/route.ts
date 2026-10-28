import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { readCollection } from "@/lib/demo-store"
import {
  canView,
  publicRecord,
  sortNewestFirst,
  type StoredOrder,
} from "@/lib/records"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to see your orders." }, { status: 401 })
  }

  try {
    const orders = await readCollection<StoredOrder>("orders")
    const visible = orders.filter((order) => canView(order, user))
    return NextResponse.json(sortNewestFirst(visible).map(publicRecord))
  } catch (error) {
    console.error("Failed to load orders:", error)
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 })
  }
}
