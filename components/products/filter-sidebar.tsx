"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown, ChevronUp } from "lucide-react"

interface FilterSidebarProps {
  categories: string[]
  onFiltersChange: (filters: FiltersState) => void
}

interface FiltersState {
  categories: string[]
  priceRange: [number, number]
  inStockOnly: boolean
}

export function FilterSidebar({ categories, onFiltersChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FiltersState>({
    categories: [],
    priceRange: [0, 2000],
    inStockOnly: false
  })
  
  const [isExpanded, setIsExpanded] = useState(true)

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category)
    
    const newFilters: FiltersState = { ...filters, categories: newCategories }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceRangeChange = (value: number[]) => {
    const newFilters: FiltersState = { ...filters, priceRange: [value[0], value[1]] as [number, number] }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleStockChange = (checked: boolean) => {
    const newFilters: FiltersState = { ...filters, inStockOnly: checked }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const newFilters: FiltersState = {
      categories: [],
      priceRange: [0, 2000],
      inStockOnly: false
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const activeFilterCount = filters.categories.length + 
    (filters.inStockOnly ? 1 : 0) + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 2000 ? 1 : 0)

  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <Card className="sticky top-4 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Filters</CardTitle>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Badge variant="default" className="bg-gray-900 text-white text-xs px-2 py-1">
                  {activeFilterCount}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                  {activeFilterCount} active
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <X className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}

            {/* Stock Filter */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-xs sm:text-sm text-gray-900">Availability</h4>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Checkbox
                  id="in-stock"
                  checked={filters.inStockOnly}
                  onCheckedChange={handleStockChange}
                  className="h-3 w-3 sm:h-4 sm:w-4"
                />
                <label
                  htmlFor="in-stock"
                  className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
                >
                  In Stock Only
                </label>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm text-gray-900">Categories</h4>
                <div className="space-y-2 sm:space-y-3">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2 sm:space-x-3">
                      <Checkbox
                        id={category}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category, checked as boolean)
                        }
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                      <label
                        htmlFor={category}
                        className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-semibold text-xs sm:text-sm text-gray-900">Price Range</h4>
              <div className="space-y-2 sm:space-y-3">
                <Slider
                  value={filters.priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={2000}
                  step={10}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>R {filters.priceRange[0]}</span>
                  <span>R {filters.priceRange[1]}</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
