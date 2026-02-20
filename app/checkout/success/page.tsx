"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Package, ArrowRight, Home, FileText, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order") || "LNR-2026-001"

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
              <p className="text-xl text-gray-600 mb-2">
                Thank you for your order
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Order #{orderNumber}
              </p>
            </div>

            {/* Order Details */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Payment Processing</span>
                  </div>
                  <p className="text-gray-600">
                    Your order has been successfully placed and is now being processed. 
                    You will receive a confirmation email shortly with your order details and payment information.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Order Confirmation</p>
                          <p className="text-sm text-gray-600">You'll receive an email with your order details and invoice</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Payment Processing</p>
                          <p className="text-sm text-gray-600">We'll process your payment via PayFast securely</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Production & Branding</p>
                          <p className="text-sm text-gray-600">Your products will be customized with your branding</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">4</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Delivery</p>
                          <p className="text-sm text-gray-600">Your order will be delivered to your specified address</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/orders" className="block">
                <Button variant="outline" className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button className="w-full bg-gray-900 hover:bg-gray-800">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>

            {/* Contact Information */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about your order, our customer service team is here to help.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/contact">
                      <Button variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.open('mailto:info@lenor.co.za')}>
                      Email Us
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open('tel:+27112345678')}>
                      Call Us
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  )
}
