"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { FileText, ShoppingCart, ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { StockIndicator } from "@/components/products/stock-indicator"
import { QuantitySelector } from "@/components/products/quantity-selector"
import { BulkPricingCalculator } from "@/components/products/bulk-pricing-calculator"
import { useCart } from "@/contexts/cart-context"
import { useQuote } from "@/contexts/quote-context"
import { useAuth } from "@/contexts/auth-context"
import { formatPrice, CATEGORIES } from "@/lib/constants"
import type { Product } from "@/lib/mock-data"

interface Props {
  product: Product
}

export function ProductDetailClient({ product }: Props) {
  const { addItem: addToCart } = useCart()
  const { addItem: addToQuote } = useQuote()
  const { isAuthenticated } = useAuth()
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const [quantity, setQuantity] = useState(product.minOrderQty)

  const categoryName =
    CATEGORIES.find((c) => c.id === product.category)?.name ?? product.category

  function handleAddToQuote() {
    addToQuote({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity,
      color: selectedColor,
      size: selectedSize,
      image: product.images[0] ?? "",
      brandingNotes: "",
      brandingPosition: product.brandingPositions[0]?.label ?? "",
    })
    toast.success(`${product.name} added to quote basket`)
  }

  function handleAddToCart() {
    addToCart({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: product.price,
      quantity,
      color: selectedColor,
      size: selectedSize,
      image: product.images[0] ?? "",
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/products?category=${product.category}`}>
                {categoryName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Image */}
        <div className="lg:w-1/2">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl font-bold text-muted-foreground/20">
                {product.name.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <div className="flex items-center gap-3">
              <StockIndicator level={product.stockLevel} />
              <span className="text-xs text-muted-foreground">
                SKU: {product.sku}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground lg:text-3xl">
              {product.name}
            </h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div>
            {isAuthenticated ? (
              <>
                <p className="text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </p>
                <p className="text-sm text-muted-foreground">
                  excl. VAT per unit | Min order: {product.minOrderQty} units
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 hover:underline">
                    Sign in to see price
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  Min order: {product.minOrderQty} units
                </p>
              </>
            )}
          </div>

          <Separator />

          {/* Color */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Colour: {selectedColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selectedColor === color
                      ? "border-accent bg-accent/10 text-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          {product.sizes.length > 1 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Size</label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Quantity
            </label>
            <QuantitySelector
              value={quantity}
              min={product.minOrderQty}
              onChange={setQuantity}
            />
            <p className="text-xs text-muted-foreground">
              Subtotal: {formatPrice(product.price * quantity)} excl. VAT
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAddToQuote}
            >
              <FileText className="mr-2 h-4 w-4" />
              Add to Quote
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>

          {/* Branding positions */}
          {product.brandingPositions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-accent" />
                  Branding Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {product.brandingPositions.map((bp) => (
                    <div key={bp.id} className="flex items-start gap-3">
                      <Badge variant="secondary" className="shrink-0">
                        {bp.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {bp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <BulkPricingCalculator product={product} />

          <Button variant="ghost" size="sm" className="w-fit" asChild>
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
