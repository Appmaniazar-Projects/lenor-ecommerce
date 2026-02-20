"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Plus, Minus, Trash2, ArrowRight } from "lucide-react"
import { useQuote } from "@/contexts/quote-context"
import { formatPrice } from "@/lib/constants"
import Link from "next/link"
import { toast } from "sonner"

export default function QuoteBasketPage() {
  const { items, removeItem, updateQuantity, clearQuote, estimatedSubtotal } = useQuote()

  const handleQuantityChange = (id: string, color: string, size: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id, color, size)
    } else {
      updateQuantity(id, color, size, newQuantity)
    }
  }

  const handleSubmitQuote = () => {
    if (items.length === 0) {
      toast.error("Your quote basket is empty")
      return
    }
    
    // In a real app, this would submit to an API
    toast.success("Quote request submitted! We'll contact you within 24 hours.")
    clearQuote()
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Quote Basket is Empty</h1>
              <p className="text-gray-600 mb-8">
                Start adding products to your quote basket to request a personalized quote.
              </p>
              <Link href="/products">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </main>
        
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Basket</h1>
              <p className="text-gray-600">
                Review your selected products and submit your quote request
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Quote Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={`${item.productId}-${item.color}-${item.size}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-gray-400">
                            {item.productName.charAt(0)}
                          </span>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                              <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                              <p className="text-sm text-gray-600">
                                {item.color} / {item.size}
                              </p>
                              {item.brandingPosition && (
                                <p className="text-sm text-gray-600">
                                  Branding: {item.brandingPosition}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.productId, item.color, item.size)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.productId, item.color, item.size, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, item.color, item.size, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                                min="1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.productId, item.color, item.size, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatPrice(item.price)} each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quote Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Quote Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Items ({items.length})</span>
                        <span>{formatPrice(estimatedSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Estimated VAT (15%)</span>
                        <span>{formatPrice(estimatedSubtotal * 0.15)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total Estimate</span>
                        <span>{formatPrice(estimatedSubtotal * 1.15)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Link href="/products" className="block">
                        <Button variant="outline" className="w-full">
                          Continue Shopping
                        </Button>
                      </Link>
                      <Button
                        onClick={clearQuote}
                        variant="ghost"
                        className="w-full"
                      >
                        Clear Quote Basket
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold">Contact Information</h4>
                      <Input placeholder="Your Name" />
                      <Input type="email" placeholder="Email Address" />
                      <Input type="tel" placeholder="Phone Number" />
                      <Input placeholder="Company Name" />
                      <Textarea
                        placeholder="Additional notes or requirements..."
                        rows={3}
                      />
                      <Button
                        onClick={handleSubmitQuote}
                        className="w-full bg-gray-900 hover:bg-gray-800"
                        size="lg"
                      >
                        Submit Quote Request
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  )
}
