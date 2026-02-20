export const SITE_NAME = "Lenor"
export const SITE_TAGLINE = "Your Branded Merchandise Partner"
export const SITE_DOMAIN = "lenor.co.za"
export const SITE_DESCRIPTION =
  "South Africa's trusted B2B supplier of branded promotional products."

export const VAT_RATE = 0.15
export const CURRENCY = "ZAR"
export const CURRENCY_SYMBOL = "R"

export function formatPrice(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const CATEGORIES = [
  { id: "apparel", name: "Apparel", slug: "apparel" },
  { id: "bags", name: "Bags", slug: "bags" },
  { id: "drinkware", name: "Drinkware", slug: "drinkware" },
  { id: "tech", name: "Tech Accessories", slug: "tech" },
  { id: "stationery", name: "Stationery", slug: "stationery" },
  { id: "outdoor", name: "Outdoor & Leisure", slug: "outdoor" },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]

export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Contact", href: "/contact" },
] as const

export const ORDER_STATUSES = [
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const

export const QUOTE_STATUSES = [
  "Pending",
  "Quoted",
  "Approved",
  "In Production",
  "Complete",
  "Declined",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]
