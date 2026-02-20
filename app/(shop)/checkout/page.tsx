import type { Metadata } from "next"
import { CheckoutClient } from "./checkout-client"

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
