import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { publicRecord } from "@/lib/records"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to see your orders." }, { status: 401 })
  }

  try {
    // Admins see every order; customers only their own.
    const orders = await getStore().orders.list(user.isAdmin ? null : user.id)
    return NextResponse.json(orders.map(publicRecord))
  } catch (error) {
    console.error("Failed to load orders:", error)
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 })
  }
}
