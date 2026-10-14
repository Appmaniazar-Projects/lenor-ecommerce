
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StockIndicator } from "./stock-indicator"
import { useCart } from "@/contexts/cart-context"
import { useQuote } from "@/contexts/quote-context"
import { useAuth } from "@/contexts/auth-context"
import { formatPrice } from "@/lib/constants"
import type { Product } from "@/lib/mock-data"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem: addToCart } = useCart()
  const { addItem: addToQuote } = useQuote()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const [imageFailed, setImageFailed] = useState(false)

  // Prefer the actual Amrod product image.
  // Never use random image selection during rendering.
  const smartImage =
    product.images?.find(
      (image) =>
        typeof image === "string" &&
        image.trim().length > 0
    ) ?? null

  function handleAddToQuote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    addToQuote({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.minOrderQty,
      color: product.colors[0] ?? "Standard",
      size: product.sizes[0] ?? "One Size",
      image: smartImage ?? "",
      brandingNotes: "",
      brandingPosition:
        product.brandingPositions[0]?.label ?? "",
    })

    toast.success(`${product.name} added to quote basket`)
    setTimeout(() => router.push("/quote-basket"), 500)
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    addToCart({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.minOrderQty,
      color: product.colors[0] ?? "Standard",
      size: product.sizes[0] ?? "One Size",
      image: smartImage ?? "",
    })

    toast.success(`${product.name} added to cart`)
    setTimeout(() => router.push("/cart"), 500)
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

  return (
    <Link
      href={`/products/${product.id}`}
      className="block h-full"
    >
      <Card className="group h-full overflow-hidden transition-colors hover:border-accent/50">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {smartImage && !imageFailed ? (
            <img
              src={smartImage}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
        </div>

        <CardContent className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {product.sku}
            </p>

            <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-accent">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {isAuthenticated ? (
                <>
                  <p className="text-lg font-bold text-foreground">
                    {formatPrice(product.price)}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    excl. VAT | Min: {product.minOrderQty}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">
                    <span className="text-blue-600 hover:text-blue-800 hover:underline">
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
                  backgroundColor:
                    colorMap[color.toLowerCase()] ?? "#e5e7eb",
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
