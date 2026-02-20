import type { Metadata } from "next"
import { OrdersClient } from "./orders-client"

export const metadata: Metadata = {
  title: "Orders & Quotes",
  description: "View your order history and quote requests.",
}

export default function OrdersPage() {
  return <OrdersClient />
}
