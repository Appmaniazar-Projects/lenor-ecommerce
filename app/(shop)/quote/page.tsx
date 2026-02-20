import type { Metadata } from "next"
import { QuoteBasketClient } from "./quote-basket-client"

export const metadata: Metadata = {
  title: "Quote Basket",
  description: "Review your quote basket and submit a quote request.",
}

export default function QuotePage() {
  return <QuoteBasketClient />
}
