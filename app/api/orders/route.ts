
import { NextResponse } from "next/server"
import type { Order } from "@/lib/mock-data"
import { readCollection } from "@/lib/demo-store"

export const runtime = "nodejs"

type StoredOrder = Order & {
  contactEmail: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")?.trim().toLowerCase()

    const orders = await readCollection<StoredOrder>("orders")
    const results = email
      ? orders.filter((order) => order.contactEmail === email)
      : orders

    return NextResponse.json(results)
  } catch (error) {
    console.error("Failed to load orders:", error)
    return NextResponse.json(
      { error: "Failed to load orders." },
      { status: 500 },
    )
  }
}
