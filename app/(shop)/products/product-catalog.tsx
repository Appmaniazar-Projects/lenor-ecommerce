"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getProducts, type PaginatedProducts } from "@/lib/api"
import type { CategoryId } from "@/lib/constants"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSearch } from "@/components/products/product-search"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductCatalog() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<PaginatedProducts | null>(null)
  const [loading, setLoading] = useState(true)

  const search = searchParams.get("search") ?? undefined
  const category = (searchParams.get("category") ?? undefined) as CategoryId | undefined
  const stockOnly = searchParams.get("stockOnly") === "true"
  const page = parseInt(searchParams.get("page") ?? "1")

  useEffect(() => {
    setLoading(true)
    getProducts({
      search,
      category,
      stockOnly,
      page,
      perPage: 12,
    }).then((result) => {
      setData(result)
      setLoading(false)
    })
  }, [search, category, stockOnly, page])

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", p.toString())
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} product${data.total !== 1 ? "s" : ""} found` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <ProductSearch />
          </div>
          {/* Mobile filter toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ProductFilters />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mt-8 flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <ProductFilters />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : data ? (
            <>
              <ProductGrid products={data.products} />

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => goToPage(data.page - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.totalPages}
                    onClick={() => goToPage(data.page + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
