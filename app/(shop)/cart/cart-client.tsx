"use client"

import Link from "next/link"
import { Trash2, ArrowLeft, ShoppingCart, ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { QuantitySelector } from "@/components/products/quantity-selector"
import { useCart } from "@/contexts/cart-context"
import { formatPrice } from "@/lib/constants"

export function CartClient() {
  const { items, itemCount, subtotal, vat, total, removeItem, updateQuantity, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Your Cart is Empty
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse our products and add items to your cart for direct ordering.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Shopping Cart
            </h1>
            <p className="text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Items */}
        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <Card key={`${item.productId}-${item.color}-${item.size}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Image placeholder */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                      <span className="text-lg font-bold text-muted-foreground/30">
                        {item.productName.charAt(0)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-semibold text-foreground hover:text-accent"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {item.color} | {item.size} | {formatPrice(item.price)}/unit
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <QuantitySelector
                          value={item.quantity}
                          min={1}
                          onChange={(qty) =>
                            updateQuantity(item.productId, item.color, item.size, qty)
                          }
                        />
                        <span className="min-w-[80px] text-right text-sm font-medium text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.productId, item.color, item.size)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="w-full lg:w-80">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">VAT (15%)</span>
                <span className="text-foreground">{formatPrice(vat)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-lg text-foreground">{formatPrice(total)}</span>
              </div>

              <Button className="mt-2 w-full" asChild>
                <Link href="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Shipping calculated at checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
