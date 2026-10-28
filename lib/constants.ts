export const SITE_NAME = "Lenor"
export const SITE_TAGLINE = "Your Branded Merchandise Partner"
export const SITE_DOMAIN = "lenor.co.za"
export const SITE_DESCRIPTION =
  "South Africa's trusted B2B supplier of branded promotional products."

/**
 * Prices are shown to everyone by default. Set
 * NEXT_PUBLIC_PRICES_REQUIRE_LOGIN=true (then rebuild) to hide them from
 * visitors until they sign in.
 */
export const PRICES_REQUIRE_LOGIN =
  process.env.NEXT_PUBLIC_PRICES_REQUIRE_LOGIN === "true"

export const VAT_RATE = 0.15
export const CURRENCY = "ZAR"
export const CURRENCY_SYMBOL = "R"

/**
 * "R 1 234.56". Formatted by hand: Node and browsers disagree on the en-ZA
 * locale ("1 234,56" vs "1,234.56"), which breaks React hydration.
 */
export function formatNumber(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0
  const [whole, fraction] = Math.abs(safe).toFixed(decimals).split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${safe < 0 ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`
}

export function formatPrice(amount: number): string {
  return `R ${formatNumber(amount, 2)}`
}

export const CATEGORIES = [
  { id: "corporate-gifts", name: "Corporate Gifts", slug: "corporate-gifts" },
  { id: "hampers", name: "Hampers", slug: "hampers" },
  { id: "gift-sets", name: "Gift Sets", slug: "gift-sets" },
  { id: "corporate-clothing", name: "Corporate Clothing", slug: "corporate-clothing" },
  { id: "headwear-and-accessories", name: "Headwear and Accessories", slug: "headwear-and-accessories" },
  { id: "workwear", name: "Workwear", slug: "workwear" },
  { id: "display", name: "Display", slug: "display" },
  { id: "custom-products", name: "Custom Products", slug: "custom-products" },
  { id: "collections-and-themes", name: "Collections and Themes", slug: "collections-and-themes" },
  { id: "all-clearance-items", name: "All Clearance Items", slug: "all-clearance-items" },
] as const

export type CategoryId = string

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
