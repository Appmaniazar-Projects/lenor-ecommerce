"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CATEGORIES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category") ?? ""
  const stockOnly = searchParams.get("stockOnly") === "true"

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/products?${params.toString()}`)
  }

  function clearAll() {
    router.push("/products")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          Clear all
        </Button>
      </div>

      <Separator />

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-foreground">Category</h4>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setParam("category", activeCategory === cat.slug ? null : cat.slug)
              }
              className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                activeCategory === cat.slug
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Stock filter */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="stock-only"
          checked={stockOnly}
          onCheckedChange={(checked) =>
            setParam("stockOnly", checked ? "true" : null)
          }
        />
        <Label htmlFor="stock-only" className="text-sm text-muted-foreground">
          In stock only
        </Label>
      </div>
    </div>
  )
}
