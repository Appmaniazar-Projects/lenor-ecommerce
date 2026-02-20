import type { Metadata } from "next"
import { ProductCatalog } from "./product-catalog"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our full range of branded promotional products including apparel, bags, drinkware, tech accessories and more.",
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductCatalog />
    </Suspense>
  )
}
