"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingDown, Info } from "lucide-react"
import { formatPrice } from "@/lib/constants"
import { useAuth } from "@/contexts/auth-context"
import type { Product } from "@/lib/mock-data"

interface BulkPricingCalculatorProps {
  product: Product
}

export function BulkPricingCalculator({ product }: BulkPricingCalculatorProps) {
  const { isAuthenticated } = useAuth()
  const [quantity, setQuantity] = useState(product.minOrderQty)
  const [showCalculator, setShowCalculator] = useState(false)

  // Don't show calculator for non-authenticated users
  if (!isAuthenticated) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Bulk Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-3">
              Sign in to access bulk pricing and volume discounts
            </p>
            <Button size="sm" asChild>
              <a href="/login">Sign In to See Pricing</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate bulk pricing tiers
  const calculateBulkPrice = (qty: number) => {
    let discount = 0
    if (qty >= 1000) discount = 0.25      // 25% off for 1000+
    else if (qty >= 500) discount = 0.20   // 20% off for 500+
    else if (qty >= 250) discount = 0.15   // 15% off for 250+
    else if (qty >= 100) discount = 0.10   // 10% off for 100+
    else if (qty >= 50) discount = 0.05    // 5% off for 50+

    return {
      unitPrice: product.price * (1 - discount),
      totalPrice: product.price * qty * (1 - discount),
      discount: discount,
      savings: product.price * qty * discount
    }
  }

  const pricing = calculateBulkPrice(quantity)

  const getPricingTier = (qty: number) => {
    if (qty >= 1000) return { tier: "Enterprise", color: "bg-purple-100 text-purple-800" }
    if (qty >= 500) return { tier: "Corporate", color: "bg-blue-100 text-blue-800" }
    if (qty >= 250) return { tier: "Business", color: "bg-green-100 text-green-800" }
    if (qty >= 100) return { tier: "Professional", color: "bg-yellow-100 text-yellow-800" }
    if (qty >= 50) return { tier: "Starter", color: "bg-gray-100 text-gray-800" }
    return { tier: "Standard", color: "bg-gray-50 text-gray-600" }
  }

  const currentTier = getPricingTier(quantity)

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Bulk Pricing Calculator
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalculator(!showCalculator)}
          >
            {showCalculator ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      
      {showCalculator && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-gray-600">
              Save more with larger orders! Prices automatically adjust based on quantity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(product.minOrderQty, parseInt(e.target.value) || product.minOrderQty))}
                min={product.minOrderQty}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pricing Tier</label>
              <div className="mt-1">
                <Badge className={currentTier.color}>
                  {currentTier.tier}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Standard Unit Price:</span>
              <span className="line-through text-gray-500">{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Your Unit Price:</span>
              <span className="font-semibold text-green-600">{formatPrice(pricing.unitPrice)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Discount:
                </span>
                <span className="font-semibold text-green-600">
                  {Math.round(pricing.discount * 100)}% OFF
                </span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Price:</span>
                <span className="text-lg">{formatPrice(pricing.totalPrice)}</span>
              </div>
              {pricing.savings > 0 && (
                <div className="flex justify-between text-sm text-green-600 mt-1">
                  <span>You save:</span>
                  <span>{formatPrice(pricing.savings)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Tiers Reference */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Volume Discounts:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>50-99 units:</span>
                <span className="text-green-600">5% off</span>
              </div>
              <div className="flex justify-between">
                <span>100-249 units:</span>
                <span className="text-green-600">10% off</span>
              </div>
              <div className="flex justify-between">
                <span>250-499 units:</span>
                <span className="text-green-600">15% off</span>
              </div>
              <div className="flex justify-between">
                <span>500-999 units:</span>
                <span className="text-green-600">20% off</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span>1000+ units:</span>
                <span className="text-green-600 font-semibold">25% off</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
