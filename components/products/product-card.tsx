"use client"

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

  function handleAddToQuote(e: React.MouseEvent) {
    e.preventDefault()
    addToQuote({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.minOrderQty,
      color: product.colors[0],
      size: product.sizes[0],
      image: product.images[0] ?? "",
      brandingNotes: "",
      brandingPosition: product.brandingPositions[0]?.label ?? "",
    })
    toast.success(`${product.name} added to quote basket`)
    setTimeout(() => router.push("/quote-basket"), 500)
  }

  // Smart image matching based on product name
  const getSmartImage = (product: Product) => {
    const name = product.name.toLowerCase()
    
    // Specific product-based image matching
    if (name.includes('t-shirt') || name.includes('tee') || name.includes('golf shirt')) {
      return [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('hoodie') || name.includes('sweatshirt')) {
      return [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1579338559194-a162d19bf424?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('cap') || name.includes('hat')) {
      return [
        "https://images.unsplash.com/photo-1574662785488-4133a8e5a0f8?w=400&h=400&fit=crop&auto=format"
      ][0]
    }
    
    if (name.includes('tote') || name.includes('bag')) {
      return [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('mug') || name.includes('cup')) {
      return [
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1527960674768-5b69250adfe1?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('pen') || name.includes('pencil')) {
      return [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('notebook') || name.includes('journal')) {
      return [
        "https://images.unsplash.com/photo-1523435288958-0a8798752a1a?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1504382262782-5b5ece6f7a09?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('phone') || name.includes('mobile')) {
      return [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    if (name.includes('power bank') || name.includes('charger')) {
      return [
        "https://images.unsplash.com/photo-1593642632821-c8b8e3db5973?w=400&h=400&fit=crop&auto=format",
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format"
      ][Math.random() > 0.5 ? 1 : 0]
    }
    
    // Default to category image
    return product.images && product.images.length > 0 ? product.images[0] : null
  }

  const smartImage = getSmartImage(product)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addToCart({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.minOrderQty,
      color: product.colors[0],
      size: product.sizes[0],
      image: product.images[0] ?? "",
    })
    toast.success(`${product.name} added to cart`)
    setTimeout(() => router.push("/cart"), 500)
  }

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full overflow-hidden transition-colors hover:border-accent/50">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {smartImage ? (
            <img
              src={smartImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <span className="text-3xl font-bold text-muted-foreground/30">
              {product.name.charAt(0)}
            </span>
          </div>
          <div className="absolute left-2 top-2">
            <StockIndicator level={product.stockLevel} />
          </div>
        </div>

        <CardContent className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">{product.sku}</p>
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
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 hover:underline">
                      Sign in to see price
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {product.minOrderQty} units
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Color dots */}
          <div className="flex flex-wrap gap-1">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                className="inline-block h-4 w-4 rounded-full border border-border"
                style={{
                  backgroundColor:
                    color.toLowerCase() === "white"
                      ? "#f5f5f5"
                      : color.toLowerCase() === "navy"
                        ? "#1e3a5f"
                        : color.toLowerCase() === "black"
                          ? "#1a1a1a"
                          : color.toLowerCase() === "red"
                            ? "#dc2626"
                            : color.toLowerCase() === "royal blue"
                              ? "#2563eb"
                              : color.toLowerCase() === "grey" || color.toLowerCase() === "grey melange"
                                ? "#9ca3af"
                                : color.toLowerCase() === "charcoal"
                                  ? "#374151"
                                  : color.toLowerCase() === "silver"
                                    ? "#c0c0c0"
                                    : color.toLowerCase() === "rose gold"
                                      ? "#b76e79"
                                      : color.toLowerCase() === "pink"
                                        ? "#ec4899"
                                        : color.toLowerCase() === "sky blue"
                                          ? "#38bdf8"
                                          : color.toLowerCase() === "khaki"
                                            ? "#c3b091"
                                            : color.toLowerCase() === "tan"
                                              ? "#d2b48c"
                                              : color.toLowerCase() === "green"
                                                ? "#22c55e"
                                                : color.toLowerCase() === "blue"
                                                  ? "#3b82f6"
                                                  : "#e5e7eb",
                }}
                title={color}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{product.colors.length - 5}
              </span>
            )}
          </div>

          {/* Actions */}
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
