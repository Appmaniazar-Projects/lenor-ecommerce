
import { NextResponse } from "next/server"
import type { Order } from "@/lib/mock-data"
import { readCollection } from "@/lib/demo-store"

export const runtime = "nodejs"

type StoredOrder = Order & {
  contactEmail: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const orders = await readCollection<StoredOrder>("orders")
    const order = orders.find(
      (item) => item.id === id || item.orderNumber === id,
    )

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 },
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Failed to load order:", error)
    return NextResponse.json(
      { error: "Failed to load order." },
      { status: 500 },
    )
  }
}
