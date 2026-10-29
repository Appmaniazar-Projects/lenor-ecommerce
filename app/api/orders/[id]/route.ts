import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { canView, publicRecord } from "@/lib/records"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to see this order." }, { status: 401 })
  }

  try {
    const { id } = await params
    const order = await getStore().orders.get(id)

    // Someone else's order looks exactly like a missing one.
    if (!order || !canView(order, user)) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    return NextResponse.json(publicRecord(order))
  } catch (error) {
    console.error("Failed to load order:", error)
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 })
  }
}
