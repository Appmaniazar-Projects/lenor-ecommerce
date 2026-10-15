"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { formatPrice } from "@/lib/constants"
import type { Product } from "@/lib/mock-data"

/** Compact, read-only product tile for rows on the home page. */
export function ProductTile({ product }: { product: Product }) {
  const { isAuthenticated } = useAuth()
  const [imageFailed, setImageFailed] = useState(false)

  const image = product.images?.find((url) => url && url.trim().length > 0)
  const distinctPrices = new Set(
    (product.variants ?? []).map((v) => v.price).filter((p) => p > 0)
  )

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-square bg-white">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-3"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-3xl font-bold text-muted-foreground/30">
            {product.name.charAt(0)}
          </div>
        )}
        {product.onPromotion && (
          <Badge className="absolute left-2 top-2 border-transparent bg-red-600 text-white">
            On Promotion
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.brand && (
          <p className="text-xs text-muted-foreground">{product.brand}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {product.name}
        </h3>

        <div className="mt-auto pt-2">
          {isAuthenticated ? (
            product.price > 0 ? (
              <p className="text-base font-bold text-foreground">
                {distinctPrices.size > 1 && (
                  <span className="mr-1 text-xs font-normal text-muted-foreground">From</span>
                )}
                {formatPrice(product.price)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Price on request</p>
            )
          ) : (
            <p className="text-sm font-medium text-primary">Sign in to see price</p>
          )}

          {product.stockLevel === "low-stock" && (
            <p className="mt-0.5 text-xs font-medium text-amber-700">Low stock</p>
          )}
        </div>
      </div>
    </Link>
  )
}