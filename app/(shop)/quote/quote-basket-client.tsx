"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Trash2,
  FileText,
  ArrowLeft,
  Upload,
  Loader2,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { QuantitySelector } from "@/components/products/quantity-selector"
import { useQuote } from "@/contexts/quote-context"
import { submitQuoteRequest } from "@/lib/api"
import { formatPrice } from "@/lib/constants"

const quoteFormSchema = z.object({
  contactName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Valid email required"),
  companyName: z.string().min(2, "Company name is required"),
  deadline: z.string().min(1, "Please select a deadline"),
  specialInstructions: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteFormSchema>

export function QuoteBasketClient() {
  const { items, itemCount, estimatedSubtotal, removeItem, updateQuantity, updateItem, clearQuote } = useQuote()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      contactName: "",
      contactEmail: "",
      companyName: "",
      deadline: "",
      specialInstructions: "",
    },
  })

  async function onSubmit(data: QuoteFormValues) {
    setSubmitting(true)
    try {
      const result = await submitQuoteRequest({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          color: i.color,
          size: i.size,
          brandingNotes: i.brandingNotes,
          brandingPosition: i.brandingPosition,
        })),
        ...data,
        specialInstructions: data.specialInstructions ?? "",
      })
      if (result.success) {
        toast.success(
          `Quote request ${result.quoteNumber} submitted! Our team will respond within 24 hours.`
        )
        clearQuote()
        router.push("/orders")
      }
    } catch {
      toast.error("Failed to submit quote. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Your Quote Basket is Empty
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse our products and add items to your quote basket to get
            started.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quote Basket
          </h1>
          <p className="text-sm text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""} in your quote basket
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Items */}
        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <Card key={`${item.productId}-${item.color}-${item.size}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Image placeholder */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted">
                      <span className="text-lg font-bold text-muted-foreground/30">
                        {item.productName.charAt(0)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/products/${item.productId}`}
                            className="font-semibold text-foreground hover:text-accent"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {item.sku} | {item.color} | {item.size}
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {formatPrice(item.price)} per unit
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            removeItem(item.productId, item.color, item.size)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <QuantitySelector
                          value={item.quantity}
                          min={1}
                          onChange={(qty) =>
                            updateQuantity(
                              item.productId,
                              item.color,
                              item.size,
                              qty
                            )
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          = {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Branding notes */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-foreground">
                          Branding Position: {item.brandingPosition || "Not specified"}
                        </label>
                        <Textarea
                          placeholder="Add branding notes (e.g., logo colour, placement details)..."
                          value={item.brandingNotes}
                          onChange={(e) =>
                            updateItem({
                              productId: item.productId,
                              color: item.color,
                              size: item.size,
                              brandingNotes: e.target.value,
                            })
                          }
                          className="min-h-[60px] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Logo upload area */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-accent" />
                Upload Your Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Drag and drop your logo here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted formats: AI, EPS, PDF, PNG, SVG (vector preferred)
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote submission form */}
        <div className="w-full lg:w-96">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Submit Quote Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimated subtotal
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(estimatedSubtotal)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Final pricing will be confirmed in your formal quotation.
                  Branding costs may vary.
                </p>
              </div>

              <Separator className="mb-4" />

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@company.co.za"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company (Pty) Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required By Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special requirements, packaging, delivery instructions..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={submitting}
                  >
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Quote Request
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
