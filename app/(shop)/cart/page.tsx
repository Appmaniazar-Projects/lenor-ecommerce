import type { Metadata } from "next"
import { CartClient } from "./cart-client"

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your cart and proceed to checkout.",
}

export default function CartPage() {
  return <CartClient />
}
