"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  FileText,
  ShoppingCart,
  ArrowLeft,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

function getImageForColor(
  images: string[],
  color: string
): string | undefined {
  if (!images?.length) return undefined

  const normalizedColor = color.toLowerCase().trim()

  const colorCodeMap: Record<string, string[]> = {
    black: ["bk"],
    grey: ["gy", "gr"],
    gray: ["gy", "gr"],
    navy: ["ny", "nv"],
    white: ["wh"],
    red: ["rd"],
    blue: ["bl"],
    green: ["gn", "gr"],
    yellow: ["yl"],
    orange: ["or"],
  }

  const codes = colorCodeMap[normalizedColor] ?? []

  if (!codes.length) {
    return images[0]
  }

  const matchingImage = images.find((image) => {
    const filename = image.toLowerCase()

    return codes.some(
      (code) =>
        filename.includes(`mo${code}`) ||
        filename.includes(`-${code}-`)
    )
  })

  return matchingImage ?? images[0]
}

export function ProductDetailClient({ product }: Props) {
  const { addItem: addToCart } = useCart()
  const { addItem: addToQuote } = useQuote()
  const { isAuthenticated } = useAuth()

  const variants = product.variants ?? []
  const images = product.images ?? []

  const availableColors = [
    ...new Set(
      variants.length > 0
        ? variants.map((variant) => variant.color)
        : product.colors
    ),
  ]

  const initialColor = availableColors[0] ?? "Standard"

  const initialSizes = [
    ...new Set(
      variants.length > 0
        ? variants
            .filter((variant) => variant.color === initialColor)
            .map((variant) => variant.size)
        : product.sizes
    ),
  ]

  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [selectedSize, setSelectedSize] = useState(
    initialSizes[0] ?? "One Size"
  )
  const [quantity, setQuantity] = useState(product.minOrderQty)
  const [selectedImage, setSelectedImage] = useState(0)
  const [manuallySelectedImage, setManuallySelectedImage] =
    useState(false)

  const categoryName =
    CATEGORIES.find((category) => category.id === product.category)
      ?.name ?? product.category

  // Resolve the exact Amrod variant for the selected colour and size.
  const selectedVariant = variants.find(
    (variant) =>
      variant.color === selectedColor &&
      variant.size === selectedSize
  )

  // Never treat a missing variant price as a valid product price.
  const selectedPrice = selectedVariant?.price ?? 0
  const selectedSku = selectedVariant?.fullCode ?? product.sku
  const selectedStock = selectedVariant?.stock ?? 0

  const hasValidPrice =
    selectedVariant != null &&
    Number.isFinite(selectedVariant.price) &&
    selectedVariant.price > 0

  const selectedStockLevel =
    !selectedVariant || selectedStock <= 0
      ? "out-of-stock"
      : selectedStock <= 10
        ? "low-stock"
        : "in-stock"

  // Only show sizes that exist for the selected colour.
  const availableSizes = [
    ...new Set(
      variants.length > 0
        ? variants
            .filter((variant) => variant.color === selectedColor)
            .map((variant) => variant.size)
        : product.sizes
    ),
  ]

  // Use a colour-matching image unless the customer selects a thumbnail.
 const colorImage =
  (product as any).colorImages?.[selectedColor]?.[0] ??
  getImageForColor(images, selectedColor)

  const mainImage = manuallySelectedImage
    ? images[selectedImage] ?? colorImage
    : colorImage ?? images[0]

  function handleColorChange(color: string) {
    setSelectedColor(color)

    const sizesForColor = [
      ...new Set(
        variants
          .filter((variant) => variant.color === color)
          .map((variant) => variant.size)
      ),
    ]

    if (
      sizesForColor.length > 0 &&
      !sizesForColor.includes(selectedSize)
    ) {
      setSelectedSize(sizesForColor[0])
    }

    setSelectedImage(0)
    setManuallySelectedImage(false)
  }

  function handleSizeChange(size: string) {
    setSelectedSize(size)
    setSelectedImage(0)
    setManuallySelectedImage(false)
  }

  function validateSelection(): boolean {
    if (!selectedVariant) {
      toast.error(
        "Please select a valid colour and size combination"
      )
      return false
    }

    if (!hasValidPrice) {
      toast.error(
        "Pricing is currently unavailable for this variant"
      )
      return false
    }

    if (selectedStock <= 0) {
      toast.error("This variant is currently out of stock")
      return false
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < product.minOrderQty
    ) {
      toast.error(
        `Minimum order quantity is ${product.minOrderQty}`
      )
      return false
    }

    if (quantity > selectedStock) {
      toast.error(
        `Only ${selectedStock} units are currently available`
      )
      return false
    }

    return true
  }

  function handleAddToQuote() {
    if (!validateSelection() || !selectedVariant) return

    addToQuote({
      productId: product.id,
      productName: product.name,
      sku: selectedVariant.fullCode,
      price: selectedVariant.price,
      quantity,
      color: selectedColor,
      size: selectedSize,
      image: mainImage ?? "",
      brandingNotes: "",
      brandingPosition:
        product.brandingPositions[0]?.label ?? "",
      brandingMethod: "",
      brandingPositions: product.brandingPositions ?? [],
    })

    toast.success(`${product.name} added to quote basket`)
  }

  function handleAddToCart() {
    if (!validateSelection() || !selectedVariant) return

    addToCart({
      productId: product.id,
      productName: product.name,
      sku: selectedVariant.fullCode,
      price: selectedVariant.price,
      quantity,
      color: selectedColor,
      size: selectedSize,
      image: mainImage ?? "",
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
            <BreadcrumbLink
              asChild
            >
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
        {/* Product images */}
        <div className="lg:w-1/2">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {mainImage ? (
              <img
                src={mainImage}
                alt={`${product.name} - ${selectedColor}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-6xl font-bold text-muted-foreground/20">
                  {product.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedImage(index)
                    setManuallySelectedImage(true)
                  }}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={
                    manuallySelectedImage &&
                    selectedImage === index
                  }
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted ${
                    (manuallySelectedImage &&
                      selectedImage === index) ||
                    (!manuallySelectedImage &&
                      image === colorImage)
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} image ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product information */}
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <div className="flex items-center gap-3">
              <StockIndicator level={selectedStockLevel} />

              <span className="text-xs text-muted-foreground">
                SKU: {selectedSku}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-foreground lg:text-3xl">
              {product.name}
            </h1>

            <p className="mt-3 leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          {/* Pricing */}
          <div>
            {isAuthenticated ? (
              <>
                {hasValidPrice ? (
                  <p className="text-3xl font-bold text-foreground">
                    {formatPrice(selectedPrice)}
                  </p>
                ) : (
                  <p className="text-base font-medium text-muted-foreground">
                    Price currently unavailable
                  </p>
                )}

                <p className="text-sm text-muted-foreground">
                  excl. VAT per unit | Min order:{" "}
                  {product.minOrderQty} units
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground">
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
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

          {/* Colour selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Colour: {selectedColor}
            </label>

            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  aria-pressed={selectedColor === color}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selectedColor === color
                      ? "border-accent bg-accent/10 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size selection */}
          {availableSizes.length > 1 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Size
              </label>

              <Select
                value={selectedSize}
                onValueChange={handleSizeChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>

                <SelectContent>
                  {availableSizes.map((size) => (
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
              Subtotal:{" "}
              {formatPrice(selectedPrice * quantity)} excl. VAT
            </p>

            {selectedVariant &&
              quantity > selectedStock &&
              selectedStock > 0 && (
                <p className="text-sm text-destructive">
                  Only {selectedStock} units are currently available.
                </p>
              )}
          </div>

          <Separator />

          {/* Cart and quote actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAddToQuote}
              disabled={
                !selectedVariant ||
                !hasValidPrice ||
                selectedStock <= 0 ||
                quantity > selectedStock
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              Add to Quote
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={
                !selectedVariant ||
                !hasValidPrice ||
                selectedStock <= 0 ||
                quantity > selectedStock
              }
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
                  {product.brandingPositions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-start gap-3"
                    >
                      <Badge
                        variant="secondary"
                        className="shrink-0"
                      >
                        {position.label}
                      </Badge>

                      <p className="text-sm text-muted-foreground">
                        {position.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <BulkPricingCalculator product={product} />

          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            asChild
          >
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
