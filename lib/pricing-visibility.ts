import "server-only"

import { getSessionUser } from "@/lib/auth"
import type { CatalogueProduct } from "@/lib/catalogue"
import { PRICES_REQUIRE_LOGIN } from "@/lib/constants"

/**
 * Prices are public unless PRICES_REQUIRE_LOGIN is on. When it is, prices
 * are removed on the server, so they never reach a visitor's browser.
 */
export async function canSeePrices(): Promise<boolean> {
  if (!PRICES_REQUIRE_LOGIN) return true
  return (await getSessionUser()) !== null
}

export function withoutPrices(product: CatalogueProduct): CatalogueProduct {
  return {
    ...product,
    price: 0,
    variants: product.variants.map((variant) => ({ ...variant, price: 0 })),
  }
}

export async function forViewer<T extends CatalogueProduct | CatalogueProduct[]>(
  products: T,
): Promise<T> {
  if (await canSeePrices()) return products
  return (
    Array.isArray(products)
      ? products.map(withoutPrices)
      : withoutPrices(products as CatalogueProduct)
  ) as T
}
