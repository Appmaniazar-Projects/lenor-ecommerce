import "server-only"

import { getSessionUser } from "@/lib/auth"
import type { CatalogueProduct } from "@/lib/catalogue"

/**
 * Lenor only shows Amrod prices to signed-in customers. Prices are removed
 * on the server, so they never reach the browser of a visitor.
 */
export async function canSeePrices(): Promise<boolean> {
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
