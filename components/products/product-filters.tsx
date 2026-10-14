"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CATEGORIES } from "@/lib/constants"
import { useAuth } from "@/contexts/auth-context"
import type { Facets, FacetOption } from "@/lib/catalogue"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ProductFiltersProps {
  /** Counts for the current result set. Undefined until the first response. */
  facets?: Facets | null
}

const MULTI_FILTERS = [
  { param: "brand", title: "Brand", key: "brands" },
  { param: "gender", title: "Gender", key: "genders" },
  { param: "colour", title: "Colour", key: "colours" },
  { param: "size", title: "Size", key: "sizes" },
  { param: "material", title: "Material", key: "materials" },
  { param: "fit", title: "Fit", key: "fits" },
] as const

// Everything "Clear all" removes. Search text and sort stay.
const FILTER_PARAMS = [
  "category",
  "brand",
  "gender",
  "colour",
  "size",
  "material",
  "fit",
  "minPrice",
  "maxPrice",
  "minStock",
  "stockOnly",
  "promotion",
  "page",
]

const COLLAPSED_COUNT = 8
const CLEARANCE_SLUG = "all-clearance-items"

function labelFromSlug(slug: string): string {
  const known = CATEGORIES.find((c) => c.slug === slug)
  if (known) return known.name

  return slug
    .split("-")
    .filter(Boolean)
    .map((word, i) =>
      i > 0 && ["and", "of", "the", "for", "in", "to"].includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

function FacetGroup({
  title,
  param,
  options,
  selected,
  onToggle,
}: {
  title: string
  param: string
  options: FacetOption[]
  selected: string[]
  onToggle: (param: string, value: string, checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // A selected value can drop to zero results. Keep it listed so it can be unticked.
  const known = new Set(options.map((o) => o.value))
  const all: FacetOption[] = [
    ...options,
    ...selected
      .filter((value) => !known.has(value))
      .map((value) => ({ value, label: value, count: 0 })),
  ]

  if (all.length === 0) return null

  const selectedSet = new Set(selected)
  const visible = expanded
    ? all
    : all.filter((o, i) => i < COLLAPSED_COUNT || selectedSet.has(o.value))
  const hiddenCount = all.length - visible.length

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {visible.map((option) => {
          const id = `${param}-${option.value}`
          return (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selectedSet.has(option.value)}
                onCheckedChange={(checked) =>
                  onToggle(param, option.value, checked === true)
                }
              />
              <Label
                htmlFor={id}
                className="flex-1 cursor-pointer text-sm font-normal text-muted-foreground"
              >
                {option.label}
              </Label>
              <span className="text-xs text-muted-foreground/70">
                {option.count}
              </span>
            </div>
          )
        })}
      </div>
      {(hiddenCount > 0 || expanded) && all.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs text-accent hover:underline"
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  )
}

export function ProductFilters({ facets }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()

  const activeCategory = searchParams.get("category") ?? ""
  const trail = activeCategory ? activeCategory.split("/") : []
  const stockOnly = searchParams.get("stockOnly") === "true"
  const promotion = searchParams.get("promotion") === "true"
  const minPrice = searchParams.get("minPrice") ?? ""
  const maxPrice = searchParams.get("maxPrice") ?? ""
  const minStock = searchParams.get("minStock") ?? ""

  function push(params: URLSearchParams) {
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false })
  }

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    push(params)
  }

  function toggleMulti(param: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.getAll(param).filter((v) => v !== value)
    params.delete(param)
    const next = checked ? [...current, value] : current
    next.forEach((v) => params.append(param, v))
    push(params)
  }

  function applyNumber(param: string, raw: string) {
    const value = raw.trim()
    const n = Number(value)
    setParam(param, value !== "" && Number.isFinite(n) && n >= 0 ? String(n) : null)
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString())
    FILTER_PARAMS.forEach((key) => params.delete(key))
    push(params)
  }

  const activeCount =
    (activeCategory ? 1 : 0) +
    MULTI_FILTERS.reduce((sum, f) => sum + searchParams.getAll(f.param).length, 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minStock ? 1 : 0) +
    (stockOnly ? 1 : 0) +
    (promotion ? 1 : 0)

  const categoryCounts = new Map(
    (facets?.categories ?? []).map((c) => [c.value, c.count])
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={clearAll}
          disabled={activeCount === 0}
        >
          Clear all
        </Button>
      </div>

      <Separator />

      {/* Categories */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-foreground">Category</h4>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setParam("category", null)}
            className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
              !activeCategory
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Categories
          </button>

          {/* Where you are: each parent is clickable to go back up. */}
          {trail.map((segment, i) => {
            const path = trail.slice(0, i + 1).join("/")
            const isCurrent = i === trail.length - 1
            return (
              <button
                key={path}
                type="button"
                onClick={() => setParam("category", path)}
                style={{ paddingLeft: `${0.75 + i * 0.75}rem` }}
                className={`rounded-md py-1.5 pr-3 text-left text-sm transition-colors ${
                  isCurrent
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {labelFromSlug(segment)}
              </button>
            )
          })}

          {/* Top-level list, or the sub-categories of the current one. */}
          {activeCategory
            ? (facets?.categories ?? []).map((child) => (
                <button
                  key={child.value}
                  type="button"
                  onClick={() => setParam("category", child.value)}
                  style={{ paddingLeft: `${0.75 + trail.length * 0.75}rem` }}
                  className="flex items-center justify-between rounded-md py-1.5 pr-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <span>{child.label}</span>
                  <span className="text-xs text-muted-foreground/70">
                    {child.count}
                  </span>
                </button>
              ))
            : CATEGORIES.map((cat) => {
                const count = categoryCounts.get(cat.slug)
                const empty =
                  Boolean(facets) && count === undefined && cat.slug !== CLEARANCE_SLUG
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setParam("category", cat.slug)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted hover:text-foreground ${
                      empty ? "text-muted-foreground/50" : "text-muted-foreground"
                    }`}
                  >
                    <span>{cat.name}</span>
                    {count !== undefined && (
                      <span className="text-xs text-muted-foreground/70">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
        </div>
      </div>

      <Separator />

      {/* Price: only shown to signed-in customers, same as the prices themselves. */}
      {isAuthenticated && (
        <>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium text-foreground">Price range (excl. VAT)</h4>
            <div className="flex items-center gap-2">
              <Input
                key={`min-${minPrice}`}
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={facets?.priceRange ? String(Math.floor(facets.priceRange.min)) : "Min"}
                defaultValue={minPrice}
                onBlur={(e) => applyNumber("minPrice", e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && applyNumber("minPrice", e.currentTarget.value)}
                className="h-8"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                key={`max-${maxPrice}`}
                type="number"
                min={0}
                inputMode="decimal"
                placeholder={facets?.priceRange ? String(Math.ceil(facets.priceRange.max)) : "Max"}
                defaultValue={maxPrice}
                onBlur={(e) => applyNumber("maxPrice", e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && applyNumber("maxPrice", e.currentTarget.value)}
                className="h-8"
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Availability */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-foreground">Availability</h4>

        <div className="flex items-center gap-2">
          <Checkbox
            id="stock-only"
            checked={stockOnly}
            onCheckedChange={(checked) => setParam("stockOnly", checked ? "true" : null)}
          />
          <Label htmlFor="stock-only" className="text-sm font-normal text-muted-foreground">
            In stock only
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="promotion"
            checked={promotion}
            onCheckedChange={(checked) => setParam("promotion", checked ? "true" : null)}
          />
          <Label htmlFor="promotion" className="text-sm font-normal text-muted-foreground">
            On promotion
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="min-stock" className="shrink-0 text-sm font-normal text-muted-foreground">
            Minimum stock
          </Label>
          <Input
            id="min-stock"
            key={`stock-${minStock}`}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            defaultValue={minStock}
            onBlur={(e) => applyNumber("minStock", e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && applyNumber("minStock", e.currentTarget.value)}
            className="h-8"
          />
        </div>
      </div>

      {/* Brand, gender, colour, size, material, fit */}
      {facets &&
        MULTI_FILTERS.filter(
          ({ param, key }) =>
            facets[key].length > 0 || searchParams.getAll(param).length > 0
        ).map(({ param, title, key }) => (
          <div key={param} className="flex flex-col gap-6">
            <Separator />
            <FacetGroup
              title={title}
              param={param}
              options={facets[key]}
              selected={searchParams.getAll(param)}
              onToggle={toggleMulti}
            />
          </div>
        ))}
    </div>
  )
}