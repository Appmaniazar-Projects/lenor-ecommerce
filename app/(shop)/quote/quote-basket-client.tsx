"use client"

import { useEffect, useRef, useState } from "react"
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
  CheckCircle2,
  X,
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
import {
  BrandingSelector,
  brandingProblem,
  validChoices,
} from "@/components/products/branding-selector"
import { useAuth } from "@/contexts/auth-context"
import { submitQuoteRequest } from "@/lib/api"
import { formatPrice, PRICES_REQUIRE_LOGIN } from "@/lib/constants"

const quoteFormSchema = z.object({
  contactName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Valid email required"),
  companyName: z.string().min(2, "Company name is required"),
  deadline: z
    .string()
    .min(1, "Please select a deadline")
    .refine((value) => value >= todayIso(), "Choose today or a later date"),
  specialInstructions: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteFormSchema>

function todayIso() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

const ACCEPTED_LOGO_TYPES =
  ".ai,.eps,.pdf,.svg,.png,.jpg,.jpeg,.webp,.tif,.tiff"
const MAX_LOGO_MB = 20

/**
 * Uploads a logo. On Vercel the file goes straight to Supabase Storage
 * (requests to the site are capped at ~4.5 MB); otherwise it's posted here.
 */
async function uploadLogo(
  file: File
): Promise<{ fileId: string; fileName?: string; kind?: string }> {
  const json = async (response: Response) => {
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || "Logo upload failed.")
    return result
  }

  const start = await json(
    await fetch("/api/logo-upload/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, size: file.size }),
    })
  )

  if (start.mode === "direct") {
    const put = await fetch(start.uploadUrl, {
      method: "PUT",
      headers: {
        "content-type": start.contentType,
        "x-upsert": "false",
        "cache-control": "max-age=3600",
      },
      body: file,
    })
    if (!put.ok) throw new Error("Logo upload failed. Please try again.")

    return json(
      await fetch("/api/logo-upload/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: start.fileId }),
      })
    )
  }

  const formData = new FormData()
  formData.append("file", file)
  const result = await json(
    await fetch("/api/logo-upload", { method: "POST", body: formData })
  )
  if (!result.fileId) throw new Error("Logo upload failed.")
  return result
}

export function QuoteBasketClient() {
  const { items, itemCount, estimatedSubtotal, removeItem, updateQuantity, updateItem, clearQuote } = useQuote()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [submittedNumber, setSubmittedNumber] = useState("")

  const [logoFileId, setLogoFileId] = useState("")
  const [logoFileName, setLogoFileName] = useState("")
  const [logoKind, setLogoKind] = useState<"vector" | "raster" | "">("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState("")
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showPrices =
    (isAuthenticated || !PRICES_REQUIRE_LOGIN) && items.every((i) => i.price > 0)

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

  // Fill in contact details for signed-in customers.
  useEffect(() => {
    if (!user) return
    const values = form.getValues()
    if (!values.contactName) form.setValue("contactName", user.name)
    if (!values.contactEmail) form.setValue("contactEmail", user.email)
    if (!values.companyName) form.setValue("companyName", user.companyName)
  }, [user, form])

  function clearLogo() {
    setLogoFileId("")
    setLogoFileName("")
    setLogoKind("")
    setLogoUploadError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleLogoUpload(file?: File) {
  if (!file) return

  if (file.size > MAX_LOGO_MB * 1024 * 1024) {
    clearLogo()
    setLogoUploadError(`The file must be ${MAX_LOGO_MB} MB or smaller.`)
    return
  }

  setLogoUploadError("")
  setUploadingLogo(true)

  try {
    const result = await uploadLogo(file)

    setLogoFileId(result.fileId)
    setLogoFileName(result.fileName || file.name)
    setLogoKind(result.kind === "vector" ? "vector" : "raster")
  } catch (error) {
    clearLogo()
    setLogoUploadError(
      error instanceof Error ? error.message : "Logo upload failed.",
    )
  } finally {
    setUploadingLogo(false)
  }
}

  async function onSubmit(data: QuoteFormValues) {
    for (const item of items) {
      if (!item.branding) continue
      const problem = brandingProblem(
        item.branding,
        item.colourCode,
        Boolean(item.branded),
        item.brandings ?? []
      )
      if (problem) {
        toast.error(`${item.productName} (${item.color}, ${item.size}): ${problem}`)
        return
      }
    }

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
          branded: Boolean(i.branded),
          brandings:
            i.branded && i.branding
              ? validChoices(i.branding, i.colourCode, i.brandings ?? []).map(
                  ({ positionCode, methodCode }) => ({ positionCode, methodCode })
                )
              : [],
        })),
        ...data,
        specialInstructions: data.specialInstructions ?? "",
        logoFileId: logoFileId || undefined,
      })
      toast.success(`Quote request ${result.quoteNumber} submitted.`)
      clearQuote()
      clearLogo()

      if (isAuthenticated && result.id) {
        router.push(`/orders/${result.id}`)
      } else {
        setSubmittedNumber(result.quoteNumber)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit quote. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedNumber) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Quote request sent
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your reference is{" "}
            <span className="font-semibold text-foreground">{submittedNumber}</span>.
            Lenor will contact you with a formal quotation.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an account to track your quotes online next time.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link href="/products">Keep browsing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      </div>
    )
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
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground/30">
                          {item.productName.charAt(0)}
                        </span>
                      )}
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
                            {showPrices
                              ? `${formatPrice(item.price)} per unit`
                              : "Price confirmed in your quotation"}
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
                        {showPrices && (
                          <span className="text-sm text-muted-foreground">
                            = {formatPrice(item.price * item.quantity)}
                          </span>
                        )}
                      </div>

                      {/* Branding notes */}
                      <div className="flex flex-col gap-1.5">
                        {item.branding ? (
                          <BrandingSelector
                            compact
                            idPrefix={`b-${item.productId}-${item.color}-${item.size}`}
                            branding={item.branding}
                            colourCode={item.colourCode}
                            branded={Boolean(item.branded)}
                            onBrandedChange={(value) =>
                              updateItem({
                                productId: item.productId,
                                color: item.color,
                                size: item.size,
                                branded: value,
                              })
                            }
                            choices={item.brandings ?? []}
                            onChoicesChange={(choices) =>
                              updateItem({
                                productId: item.productId,
                                color: item.color,
                                size: item.size,
                                brandings: choices,
                                brandingPosition: choices.map((c) => c.positionName).join(", "),
                                brandingMethod: choices.map((c) => c.methodName).join(", "),
                              })
                            }
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Branding: {item.brandingPosition || "describe it in the notes below"}
                          </p>
                        )}
                        <Textarea
                          placeholder="Notes for Lenor (logo colours, Pantone references, size)..."
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
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_LOGO_TYPES}
                className="sr-only"
                id="logo-file"
                onChange={(e) => void handleLogoUpload(e.target.files?.[0])}
              />
              {logoFileId ? (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <span className="truncate text-sm font-medium text-foreground">
                        {logoFileName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove logo"
                      onClick={clearLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {logoKind === "raster" && (
                    <p className="text-xs text-amber-700">
                      This is an image file. Screen print, pad print, laser engraving
                      and debossing need vector artwork (AI, EPS, PDF or SVG). Lenor
                      will ask for one if your branding method needs it.
                    </p>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    void handleLogoUpload(e.dataTransfer.files?.[0])
                  }}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    dragging ? "border-accent bg-accent/5" : "border-border bg-muted/30"
                  }`}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {uploadingLogo ? "Uploading..." : "Drag and drop your logo here"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI, EPS, PDF, SVG (vector preferred), PNG, JPG, WebP or TIFF, up to{" "}
                    {MAX_LOGO_MB} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
              {logoUploadError && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {logoUploadError}
                </p>
              )}
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
                    {showPrices ? formatPrice(estimatedSubtotal) : "On quotation"}
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
                          <Input type="date" min={todayIso()} {...field} />
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
                    disabled={submitting || uploadingLogo}
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
