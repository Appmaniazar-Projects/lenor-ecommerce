"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, ArrowLeft, CreditCard, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { createOrder } from "@/lib/api"
import { formatPrice } from "@/lib/constants"

const checkoutSchema = z.object({
  contactName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  billingAddress: z.string().min(10, "Billing address is required"),
  shippingAddress: z.string().min(10, "Shipping address is required"),
  sameAsShipping: z.boolean(),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export function CheckoutClient() {
  const { items, subtotal, vat, total, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">
              Please sign in to proceed with checkout.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button size="lg" className="w-full bg-gray-900 hover:bg-gray-800">
                  Sign In to Continue
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="w-full">
                  Back to Cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      billingAddress: "",
      shippingAddress: "",
      sameAsShipping: true,
    },
  })

  const sameAsShipping = form.watch("sameAsShipping")

  async function onSubmit(data: CheckoutFormValues) {
    setLoading(true)
    try {
      const result = await createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          color: i.color,
          size: i.size,
          unitPrice: i.price,
        })),
        billingAddress: data.billingAddress,
        shippingAddress: data.sameAsShipping
          ? data.billingAddress
          : data.shippingAddress,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      })
      if (result.success) {
        toast.success(
          `Order ${result.orderNumber} placed successfully! You will be redirected to PayFast for payment.`
        )
        clearCart()
        router.push("/orders")
      }
    } catch {
      toast.error("Failed to place order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Nothing to Checkout
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add items to your cart before proceeding to checkout.
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
          <Link href="/cart">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Checkout
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Form */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@company.co.za" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+27 XX XXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Full street address, city, postal code"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sameAsShipping"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-muted-foreground">
                          Shipping address same as billing
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {!sameAsShipping && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Full delivery address, city, postal code"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Place Order & Pay with PayFast
              </Button>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.color}-${item.size}`}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground line-clamp-1">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.color} | {item.size} x{item.quantity}
                    </p>
                  </div>
                  <span className="ml-4 shrink-0 text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">VAT (15%)</span>
                <span className="text-foreground">{formatPrice(vat)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-lg text-foreground">
                  {formatPrice(total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
