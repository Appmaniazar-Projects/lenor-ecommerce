"use client"

import { useState, useMemo } from "react"
import { ProductGrid } from "./product-grid"
import { FilterSidebar } from "./filter-sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { Product } from "@/lib/mock-data"

interface FiltersState {
  categories: string[]
  priceRange: [number, number]
  inStockOnly: boolean
}

interface ProductCatalogProps {
  products: Product[]
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [filters, setFilters] = useState<FiltersState>({
    categories: [],
    priceRange: [0, 2000],
    inStockOnly: false
  })

  // Extract unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))]
    return uniqueCategories
  }, [products])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply filters
    // Note: Stock filtering based on stockLevel
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.stockLevel === "in-stock")
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      )
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      )
    }

    // Sort products
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "stock":
        filtered.sort((a, b) => {
          const stockOrder = { "in-stock": 0, "low-stock": 1, "out-of-stock": 2 }
          return stockOrder[a.stockLevel] - stockOrder[b.stockLevel]
        })
        break
      default:
        break
    }

    return filtered
  }, [products, searchTerm, sortBy, filters])

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Sidebar - Mobile responsive */}
      <FilterSidebar 
        categories={categories}
        onFiltersChange={handleFiltersChange}
      />
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search and Sort Bar - Mobile responsive */}
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 w-full sm:max-w-lg">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <Input
                placeholder="Shop for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 sm:pl-12 h-10 sm:h-12 text-sm sm:text-base border-gray-200 focus:border-gray-400 focus:ring-gray-100 rounded-lg sm:rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:block">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40 md:w-48 h-10 sm:h-12 border-gray-200 rounded-lg sm:rounded-xl text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="stock">Availability</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count - Mobile responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{filteredAndSortedProducts.length}</span> of <span className="font-bold text-gray-900">{products.length}</span> products
          </div>
          {filteredAndSortedProducts.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setSortBy("name")
                setFilters({ categories: [], priceRange: [0, 2000], inStockOnly: false })
              }}
              className="text-xs sm:text-sm h-8 sm:h-9 self-start sm:self-auto"
            >
              Clear All Filters
            </Button>
          )}
        </div>

        {/* Product Grid */}
        <ProductGrid products={filteredAndSortedProducts} />
      </div>
    </div>
  )
}
