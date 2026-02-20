"use client"

import Link from "next/link"
import { ProductGrid } from "@/components/products"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, Zap, Package, CheckCircle, TrendingUp, Shield } from "lucide-react"
import { MOCK_PRODUCTS } from "@/lib/mock-data"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main>
        {/* Hero Section - Enhanced */}
        <section className="bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800 text-white py-20 lg:py-32 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%227%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Trusted by 1000+ South African Businesses</span>
                  </div>
                  
                  <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
                    Premium Business
                    <br />
                    <span className="text-blue-400">Branding Solutions</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    Transform your brand with our curated selection of high-quality business products. 
                    Professional branding, competitive pricing, and fast delivery across South Africa.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                    <Link href="/products">
                      <Button 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 h-14 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl border-2 border-blue-600 hover:border-blue-700"
                      >
                        Shop Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/quote-basket">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 text-lg px-8 py-4 h-14 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Get Quote
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium">Quality Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm font-medium">Fast Turnaround</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      <span className="text-sm font-medium">Secure Payments</span>
                    </div>
                  </div>
                </div>
                
                {/* Right Content - Feature Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Package className="h-8 w-8 text-blue-400 mb-3" />
                    <h3 className="font-semibold text-lg mb-2">500+ Products</h3>
                    <p className="text-sm text-gray-300">Extensive range of business products</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Star className="h-8 w-8 text-yellow-400 mb-3" />
                    <h3 className="font-semibold text-lg mb-2">4.8/5 Rating</h3>
                    <p className="text-sm text-gray-300">Trusted by South African businesses</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Zap className="h-8 w-8 text-green-400 mb-3" />
                    <h3 className="font-semibold text-lg mb-2">24-48hr Delivery</h3>
                    <p className="text-sm text-gray-300">Fast delivery nationwide</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Shield className="h-8 w-8 text-purple-400 mb-3" />
                    <h3 className="font-semibold text-lg mb-2">100% Secure</h3>
                    <p className="text-sm text-gray-300">Safe payment processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Featured Products</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our most popular business products, ready for immediate customization and fast delivery.
              </p>
            </div>
            
            <ProductGrid products={MOCK_PRODUCTS.slice(0, 8)} />
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  )
}
