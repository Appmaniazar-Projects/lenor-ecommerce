/**
 * Stock helpers shared by the product page, the stock window and the
 * quote basket. Plain functions, safe to use in the browser.
 */

export interface StockVariant {
  fullCode: string
  color: string
  size: string
  stock: number
  incoming: number
}

export interface ProductStock {
  productId: string
  sku: string
  name: string
  variants: StockVariant[]
  /** When this stock was fetched from Amrod (ms since epoch). */
  updatedAt: number
}

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock"

/** Same thresholds as the catalogue: 10 or fewer is "low". */
export const LOW_STOCK_AT = 10

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out-of-stock"
  if (stock <= LOW_STOCK_AT) return "low-stock"
  return "in-stock"
}

/** Total stock and incoming per colour, across all its sizes. */
export function stockByColour(
  variants: Pick<StockVariant, "color" | "stock" | "incoming">[],
): Map<string, { stock: number; incoming: number }> {
  const totals = new Map<string, { stock: number; incoming: number }>()
  for (const v of variants) {
    const t = totals.get(v.color) ?? { stock: 0, incoming: 0 }
    t.stock += Math.max(0, v.stock || 0)
    t.incoming += Math.max(0, v.incoming || 0)
    totals.set(v.color, t)
  }
  return totals
}

/** "1 240" style number, matching formatNumber in constants. */
export function formatStock(n: number): string {
  return Math.max(0, Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

/** Short label for buttons and lines, e.g. "1 240 in stock". */
export function stockLabel(stock: number): string {
  return stock > 0 ? `${formatStock(stock)} in stock` : "Out of stock"
}
