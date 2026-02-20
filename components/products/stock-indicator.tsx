import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StockIndicatorProps {
  level: "in-stock" | "low-stock" | "out-of-stock"
  className?: string
}

const config = {
  "in-stock": {
    label: "In Stock",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  "low-stock": {
    label: "Low Stock",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  "out-of-stock": {
    label: "Out of Stock",
    className: "bg-red-100 text-red-800 border-red-200",
  },
} as const

export function StockIndicator({ level, className }: StockIndicatorProps) {
  const { label, className: badgeClass } = config[level]
  return (
    <Badge variant="outline" className={cn(badgeClass, className)}>
      {label}
    </Badge>
  )
}
