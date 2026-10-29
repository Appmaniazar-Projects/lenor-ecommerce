"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StockIndicator } from "./stock-indicator"
import { useCart } from "@/contexts/cart-context"
import { useQuote } from "@/contexts/quote-context"
import { useAuth } from "@/contexts/auth-context"
import { formatNumber, formatPrice, PRICES_REQUIRE_LOGIN } from "@/lib/constants"
import type { Product } from "@/lib/mock-data"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
}

const colorMap: Record<string, string> = {
  white: "#f5f5f5",
  navy: "#1e3a5f",
  black: "#1a1a1a",
  red: "#dc2626",
  "royal blue": "#2563eb",
  grey: "#9ca3af",
  "grey melange": "#9ca3af",
  charcoal: "#374151",
  silver: "#c0c0c0",
  "rose gold": "#b76e79",
  pink: "#ec4899",
  "sky blue": "#38bdf8",
  khaki: "#c3b091",
  tan: "#d2b48c",
  green: "#22c55e",
  blue: "#3b82f6",
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem: addToCart } = useCart()
  const { addItem: addToQuote } = useQuote()
  const { isAuthenticated } = useAuth()
  const showPrice = isAuthenticated || !PRICES_REQUIRE_LOGIN
  const router = useRouter()

  const [imageFailed, setImageFailed] = useState(false)

  // Prefer the actual Amrod product image.
  // Never use random image selection during rendering.
  const smartImage =
    product.images?.find(
      (image) => typeof image === "string" && image.trim().length > 0
    ) ?? null

  // What "add" from the card means: the first colour and size.
  const defaultColor = product.colors[0] ?? "Standard"
  const defaultSize = product.sizes[0] ?? "One Size"
  const defaultVariant = product.variants?.find(
    (variant) => variant.color === defaultColor && variant.size === defaultSize
  )

  const sku = defaultVariant?.fullCode ?? product.sku
  const unitPrice =
    defaultVariant && defaultVariant.price > 0
      ? defaultVariant.price
      : product.price

  // Sizes can be priced differently, so show "From" when they are.
  const distinctPrices = new Set(
    (product.variants ?? []).map((v) => v.price).filter((p) => p > 0)
  )
  const hasPriceRange = distinctPrices.size > 1

  function variantInStock() {
    if (defaultVariant && defaultVariant.stock <= 0) {
      toast.error("This option is currently out of stock")
      return false
    }
    return true
  }

  function handleAddToQuote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    addToQuote({
      productId: product.id,
      productName: product.name,
      sku,
      price: unitPrice,
      quantity: product.minOrderQty,
      color: defaultColor,
      size: defaultSize,
      image: smartImage ?? "",
      brandingNotes: "",
      brandingPosition: "",
      brandingMethod: "",
      brandingPositions: product.brandingPositions,
      // Starts unbranded; branding can be chosen in the quote basket.
      colourCode: defaultVariant?.colourCode ?? null,
      branding: product.branding,
      branded: false,
      brandings: [],
    })

    toast.success(`${product.name} added to quote basket`)
    setTimeout(() => router.push("/quote"), 500)
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!showPrice) {
      toast.info("Sign in to see prices and order")
      router.push(`/login?next=${encodeURIComponent(`/products/${product.id}`)}`)
      return
    }

    if (!variantInStock()) return

    if (!(unitPrice > 0)) {
      toast.error("Pricing is currently unavailable for this item")
      return
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      sku,
      price: unitPrice,
      quantity: product.minOrderQty,
      color: defaultColor,
      size: defaultSize,
      image: smartImage ?? "",
    })

    toast.success(`${product.name} added to cart`)
    setTimeout(() => router.push("/cart"), 500)
  }

  const genders = product.genders ?? []
  const hasStockInfo = typeof product.stockOnHand === "number"

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <Card className="group h-full overflow-hidden transition-colors hover:border-accent/50">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-white">
          {smartImage && !imageFailed ? (
            <img
              src={smartImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <span className="text-3xl font-bold text-muted-foreground/30">
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="absolute left-2 top-2">
            <StockIndicator level={product.stockLevel} />
          </div>

          {product.onPromotion && (
            <Badge className="absolute right-2 top-2 border-transparent bg-red-600 text-white">
              On Promotion
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-col gap-3 p-4">
          <div>
            {product.brand && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.brand}
              </p>
            )}

            <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-accent">
              {product.name}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {genders.length > 0 && <span>{genders.join(" · ")}</span>}
              <span>{product.id}</span>
            </div>
          </div>

          {(hasStockInfo || product.sizeRange) && (
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {hasStockInfo && (
                <p>
                  Stock on hand:{" "}
                  <span className="font-medium text-foreground">
                    {formatNumber(product.stockOnHand ?? 0)}
                  </span>
                  {(product.incomingStock ?? 0) > 0 && (
                    <>
                      {" "}
                      · Incoming:{" "}
                      {formatNumber(product.incomingStock ?? 0)}
                    </>
                  )}
                </p>
              )}
              {product.sizeRange && <p>Size: {product.sizeRange}</p>}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              {showPrice ? (
                <>
                  <p className="text-lg font-bold text-foreground">
                    {hasPriceRange && (
                      <span className="mr-1 text-xs font-normal text-muted-foreground">
                        From
                      </span>
                    )}
                    {product.price > 0 ? formatPrice(product.price) : "Price on request"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    excl. VAT | Min: {product.minOrderQty}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">
                    <span className="text-primary hover:underline">
                      Sign in to see price
                    </span>
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Min: {product.minOrderQty} units
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Available colour indicators */}
          <div className="flex flex-wrap gap-1">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                className="inline-block h-4 w-4 rounded-full border border-border"
                style={{
                  backgroundColor: colorMap[color.toLowerCase()] ?? "#e5e7eb",
                }}
                title={color}
                aria-label={color}
              />
            ))}

            {product.colors.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{product.colors.length - 5}
              </span>
            )}
          </div>

          {/* Cart and quote actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAddToQuote}
            >
              <FileText className="mr-1 h-3 w-3" />
              Quote
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-1 h-3 w-3" />
              Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}