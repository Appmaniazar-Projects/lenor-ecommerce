"use client"

import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Package, 
  FileText, 
  Settings, 
  LogOut, 
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { MOCK_ORDERS, MOCK_QUOTES } from "@/lib/mock-data"

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h1>
              <p className="text-gray-600 mb-8">
                Please sign in to access your account dashboard.
              </p>
              <Link href="/login">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800">
                  Sign In
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

  // Get user's recent orders and quotes
  const recentOrders = MOCK_ORDERS.slice(0, 3)
  const recentQuotes = MOCK_QUOTES.slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
              <p className="text-gray-600">
                Manage your profile, orders, and quote requests
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* User Profile */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">Business Customer</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{user.companyName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{user.address}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Orders and Quotes */}
              <div className="lg:col-span-2 space-y-8">
                {/* Recent Orders */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                    <Link href="/orders">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length > 0 ? (
                      <div className="space-y-4">
                        {recentOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {order.items.length} items • {formatPrice(order.total)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No orders yet</p>
                        <Link href="/products">
                          <Button size="sm">
                            Start Shopping
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Quotes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Quote Requests
                    </CardTitle>
                    <Link href="/quotes">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentQuotes.length > 0 ? (
                      <div className="space-y-4">
                        {recentQuotes.map((quote) => (
                          <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
                                <Badge variant={quote.status === "Complete" ? "default" : "secondary"}>
                                  {quote.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {quote.items.length} items • {formatPrice(quote.estimatedTotal || 0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(quote.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Link href={`/quotes/${quote.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No quote requests yet</p>
                        <Link href="/products">
                          <Button size="sm">
                            Request a Quote
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Link href="/products">
                        <Button variant="outline" className="w-full">
                          <Package className="mr-2 h-4 w-4" />
                          Shop
                        </Button>
                      </Link>
                      <Link href="/quote">
                        <Button variant="outline" className="w-full">
                          <FileText className="mr-2 h-4 w-4" />
                          Quote
                        </Button>
                      </Link>
                      <Link href="/cart">
                        <Button variant="outline" className="w-full">
                          Shopping Cart
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button variant="outline" className="w-full">
                          Contact
                        </Button>
                      </Link>
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

function formatPrice(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
