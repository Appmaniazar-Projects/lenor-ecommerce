import { redirect } from "next/navigation"

// The quote basket lives at /quote. Old links still land in the right place.
export default function QuoteBasketRedirect() {
  redirect("/quote")
}
