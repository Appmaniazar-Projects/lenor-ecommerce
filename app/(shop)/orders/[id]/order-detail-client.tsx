"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getOrder, getQuote } from "@/lib/api"
import { formatPrice } from "@/lib/constants"
import type { Order, QuoteRequest } from "@/lib/mock-data"
import { OrderStatusBadge, QuoteStatusBadge } from "@/components/orders/status-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function OrderDetailClient({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [quote, setQuote] = useState<QuoteRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (id.startsWith("ord-")) {
        const o = await getOrder(id)
        setOrder(o)
      } else if (id.startsWith("qr-")) {
        const q = await getQuote(id)
        setQuote(q)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Colour / Size</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.color} / {item.size}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex flex-col items-end gap-1">
                <div className="flex w-48 justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex w-48 justify-between text-sm">
                  <span className="text-muted-foreground">VAT (15%)</span>
                  <span>{formatPrice(order.vat)}</span>
                </div>
                <div className="flex w-48 justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (quote) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {quote.quoteNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Submitted {new Date(quote.date).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })} by {quote.companyName}
            </p>
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quote Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Colour / Size</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Branding</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.color} / {item.size}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.brandingPosition}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {item.brandingNotes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {quote.estimatedTotal && (
                <>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="flex w-48 justify-between font-semibold">
                      <span>Est. Total</span>
                      <span>{formatPrice(quote.estimatedTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{quote.contactName}</p>
                <p>{quote.contactEmail}</p>
                <p>{quote.companyName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Deadline:</span>{" "}
                  {new Date(quote.deadline).toLocaleDateString("en-ZA")}
                </p>
                {quote.specialInstructions && (
                  <p>
                    <span className="font-medium text-foreground">Instructions:</span>{" "}
                    {quote.specialInstructions}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
      <h1 className="text-2xl font-bold text-foreground">Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The order or quote you are looking for could not be found.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/orders">Back to Orders</Link>
      </Button>
    </div>
  )
}
