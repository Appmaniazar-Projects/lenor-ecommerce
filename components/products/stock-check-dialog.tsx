"use client"

import { useCallback, useEffect, useState } from "react"
import { Boxes, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  formatStock,
  stockByColour,
  stockLevel,
  type ProductStock,
  type StockVariant,
} from "@/lib/stock"

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL", "5XL", "6XL"]

function sizeRank(size: string): number {
  const i = SIZE_ORDER.indexOf(size.toUpperCase())
  if (i >= 0) return i
  const n = parseFloat(size)
  return Number.isFinite(n) ? 100 + n : 1000
}

const levelClass = {
  "in-stock": "text-emerald-700",
  "low-stock": "text-amber-700",
  "out-of-stock": "text-red-700",
} as const

// One request per product per minute, shared by every component on the page.
const STOCK_CACHE_MS = 60_000
const stockCache = new Map<string, { at: number; promise: Promise<ProductStock> }>()

function fetchStock(productId: string, force: boolean): Promise<ProductStock> {
  const cached = stockCache.get(productId)
  if (!force && cached && Date.now() - cached.at < STOCK_CACHE_MS) return cached.promise

  const promise = fetch(`/api/stock/${encodeURIComponent(productId)}`, { cache: "no-store" }).then(
    async (res) => {
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? "Stock is temporarily unavailable.")
      return json as ProductStock
    },
  )
  stockCache.set(productId, { at: Date.now(), promise })
  promise.catch(() => stockCache.delete(productId))
  return promise
}

/** Loads live stock for one product from /api/stock/[productId]. */
export function useProductStock(productId: string, enabled = true) {
  const [data, setData] = useState<ProductStock | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (force = false) => {
      setLoading(true)
      setError(null)
      try {
        setData(await fetchStock(productId, force))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Stock is temporarily unavailable.")
      } finally {
        setLoading(false)
      }
    },
    [productId],
  )

  useEffect(() => {
    if (enabled) void load()
  }, [enabled, load])

  return { data, loading, error, reload: load }
}

function StockCell({ variant, highlight }: { variant?: StockVariant; highlight: boolean }) {
  if (!variant) {
    return <td className="px-3 py-2 text-center text-muted-foreground/50">–</td>
  }
  const level = stockLevel(variant.stock)
  return (
    <td
      className={cn(
        "px-3 py-2 text-center tabular-nums",
        highlight && "bg-accent/10 font-semibold",
      )}
    >
      <span className={levelClass[level]}>{formatStock(variant.stock)}</span>
      {variant.incoming > 0 && (
        <span className="block text-[11px] text-muted-foreground">
          +{formatStock(variant.incoming)} incoming
        </span>
      )}
    </td>
  )
}

/** Colour x size table of stock on hand (and incoming). */
export function StockTable({
  stock,
  selectedColor,
  selectedSize,
}: {
  stock: ProductStock
  selectedColor?: string
  selectedSize?: string
}) {
  const colours = [...new Set(stock.variants.map((v) => v.color))]
  const sizes = [...new Set(stock.variants.map((v) => v.size))].sort(
    (a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b),
  )
  const totals = stockByColour(stock.variants)
  const lookup = new Map(stock.variants.map((v) => [`${v.color}|${v.size}`, v]))
  const singleSize = sizes.length <= 1

  if (stock.variants.length === 0) {
    return <p className="text-sm text-muted-foreground">No stock information for this product.</p>
  }

  return (
    <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Colour</th>
            {!singleSize &&
              sizes.map((size) => (
                <th
                  key={size}
                  className={cn(
                    "px-3 py-2 text-center font-semibold",
                    size === selectedSize && "text-accent",
                  )}
                >
                  {size}
                </th>
              ))}
            <th className="px-3 py-2 text-center font-semibold">{singleSize ? "In stock" : "Total"}</th>
          </tr>
        </thead>
        <tbody>
          {colours.map((color) => {
            const total = totals.get(color) ?? { stock: 0, incoming: 0 }
            const isSelected = color === selectedColor
            return (
              <tr key={color} className={cn("border-t border-border bg-card", isSelected && "bg-accent/5")}>
                <th
                  scope="row"
                  className={cn("px-3 py-2 text-left font-medium", isSelected && "text-accent")}
                >
                  {color}
                </th>
                {!singleSize &&
                  sizes.map((size) => (
                    <StockCell
                      key={size}
                      variant={lookup.get(`${color}|${size}`)}
                      highlight={isSelected && size === selectedSize}
                    />
                  ))}
                <td className="px-3 py-2 text-center font-semibold tabular-nums">
                  <span className={levelClass[stockLevel(total.stock)]}>{formatStock(total.stock)}</span>
                  {total.incoming > 0 && (
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      +{formatStock(total.incoming)} incoming
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * "Check stock" button that opens a window with live stock for every
 * colour and size, like Amrod's stock checker.
 */
export function StockCheckDialog({
  productId,
  productName,
  selectedColor,
  selectedSize,
  trigger,
}: {
  productId: string
  productName: string
  selectedColor?: string
  selectedSize?: string
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { data, loading, error, reload } = useProductStock(productId, open)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <Boxes className="mr-2 h-4 w-4" />
            Check stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Stock: {productName}</DialogTitle>
          <DialogDescription>
            Live stock from our supplier, per colour and size. Stock changes
            quickly, so we confirm it again on your quote.
          </DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking stock...
          </div>
        ) : error && !data ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : data ? (
          <>
            <StockTable stock={data} selectedColor={selectedColor} selectedSize={selectedSize} />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                <span className="text-emerald-700">Green</span>: in stock ·{" "}
                <span className="text-amber-700">Amber</span>: 10 or fewer ·{" "}
                <span className="text-red-700">Red</span>: out of stock
              </span>
              <span className="flex items-center gap-2">
                Updated {new Date(data.updatedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => void reload(true)}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                  <span className="sr-only">Refresh stock</span>
                </Button>
              </span>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Stock line for a quote basket item: how many of this exact colour and
 * size are in stock, a warning when the quantity is more, and the full
 * stock window.
 */
export function QuoteLineStock({
  productId,
  productName,
  sku,
  color,
  size,
  quantity,
}: {
  productId: string
  productName: string
  sku: string
  color: string
  size: string
  quantity: number
}) {
  const { data, loading, error } = useProductStock(productId)
  const variant = data?.variants.find((v) => v.fullCode === sku)

  let line: React.ReactNode
  if (loading && !data) {
    line = (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking stock...
      </span>
    )
  } else if (error || !variant) {
    line = <span className="text-muted-foreground">Stock will be confirmed on your quote</span>
  } else {
    const level = stockLevel(variant.stock)
    line = (
      <span className={levelClass[level]}>
        {variant.stock > 0 ? `${formatStock(variant.stock)} in stock` : "Out of stock"}
        {variant.incoming > 0 && (
          <span className="text-muted-foreground"> · {formatStock(variant.incoming)} incoming</span>
        )}
      </span>
    )
  }

  const short = variant && quantity > variant.stock

  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted/50 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
          {line}
        </span>
        <StockCheckDialog
          productId={productId}
          productName={productName}
          selectedColor={color}
          selectedSize={size}
          trigger={
            <button type="button" className="font-medium text-accent hover:underline">
              Check stock
            </button>
          }
        />
      </div>
      {short && (
        <p className="text-amber-700">
          You asked for {formatStock(quantity)}, but only {formatStock(variant.stock)} are in stock
          for {color}
          {size && size !== "One Size" ? `, ${size}` : ""}. You can still send the quote: we will
          confirm lead time{variant.incoming > 0 ? " for the incoming stock" : ""} or suggest another
          colour.
        </p>
      )}
    </div>
  )
}
