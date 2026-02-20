"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getOrders, getQuotes } from "@/lib/api"
import { formatPrice } from "@/lib/constants"
import type { Order, QuoteRequest } from "@/lib/mock-data"
import { OrderStatusBadge, QuoteStatusBadge } from "@/components/orders/status-badges"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, ClipboardList } from "lucide-react"

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOrders(), getQuotes()]).then(([o, q]) => {
      setOrders(o)
      setQuotes(q)
      setLoading(false)
    })
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
        Orders & Quotes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track your orders and quote requests.
      </p>

      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Quote Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-lg font-medium text-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground">Your order history will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-lg font-medium text-foreground">No quotes yet</p>
                <p className="text-sm text-muted-foreground">Your quote requests will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Est. Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Link
                          href={`/orders/${quote.id}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {quote.quoteNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(quote.date).toLocaleDateString("en-ZA")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {quote.companyName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {quote.items.length} item{quote.items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.estimatedTotal
                          ? formatPrice(quote.estimatedTotal)
                          : "TBD"}
                      </TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={quote.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
