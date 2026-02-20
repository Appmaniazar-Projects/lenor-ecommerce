import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { OrderStatus, QuoteStatus } from "@/lib/constants"

const orderStatusConfig: Record<OrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Paid: "bg-blue-100 text-blue-800 border-blue-200",
  Processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Shipped: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Cancelled: "bg-red-100 text-red-800 border-red-200",
}

const quoteStatusConfig: Record<QuoteStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Quoted: "bg-blue-100 text-blue-800 border-blue-200",
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "In Production": "bg-indigo-100 text-indigo-800 border-indigo-200",
  Complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Declined: "bg-red-100 text-red-800 border-red-200",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn(orderStatusConfig[status])}>
      {status}
    </Badge>
  )
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant="outline" className={cn(quoteStatusConfig[status])}>
      {status}
    </Badge>
  )
}
