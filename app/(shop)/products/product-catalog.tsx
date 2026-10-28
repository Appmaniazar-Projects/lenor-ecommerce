"use client"

import { formatNumber } from "@/lib/constants"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import type { PaginatedProducts } from "@/lib/api"
import type { Facets } from "@/lib/catalogue"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductSearch } from "@/components/products/product-search"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type CatalogueResponse = PaginatedProducts & { facets: Facets }

const PER_PAGE = 12
// Amrod's own listing defaults to "Price Low - High".
const DEFAULT_SORT = "price-asc"

export function ProductCatalog() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<CatalogueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const queryString = searchParams.toString()
  const sort = searchParams.get("sort") ?? DEFAULT_SORT

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(queryString)

    if (!params.has("page")) params.set("page", "1")
    params.set("perPage", String(PER_PAGE))
    if (!params.has("sort")) params.set("sort", DEFAULT_SORT)

    setLoading(true)
    setError(null)

    fetch(`/api/products?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load products (${response.status})`)
        }
        return (await response.json()) as CatalogueResponse
      })
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return
        setError(err.message)
        setLoading(false)
      })

    // A newer filter change cancels the older request.
    return () => controller.abort()
  }, [queryString])

  function pushParams(params: URLSearchParams) {
    const qs = params.toString()
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false })
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", p.toString())
    pushParams(params)
  }

  function changeSort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    params.delete("page")
    pushParams(params)
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
            {data
              ? `${formatNumber(data.total)} product${
                  data.total !== 1 ? "s" : ""
                } found`
              : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <ProductSearch />
          </div>

          <Select value={sort} onValueChange={changeSort}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low - High</SelectItem>
              <SelectItem value="price-desc">Price: High - Low</SelectItem>
              <SelectItem value="name-asc">Name: A - Z</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filter toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 px-4 pb-6">
                <ProductFilters facets={data?.facets} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mt-8 flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <ProductFilters facets={data?.facets} />
        </aside>

        {/* Product grid */}
        <div className="min-w-0 flex-1">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.refresh()}
              >
                Try again
              </Button>
            </div>
          ) : loading && !data ? (
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
            <div className={loading ? "opacity-60 transition-opacity" : ""}>
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
