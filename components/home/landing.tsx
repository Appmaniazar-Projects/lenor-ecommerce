import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  FileText,
  Palette,
  Search,
  Shirt,
  Sparkles,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CatalogueProduct } from "@/lib/catalogue"
import { CATEGORIES, formatNumber } from "@/lib/constants"

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

const TILTS = ["-rotate-6", "rotate-3", "rotate-6", "-rotate-3"]

export function LandingHero({
  total,
  products,
}: {
  total: number
  products: CatalogueProduct[]
}) {
  const shots = products.filter((p) => p.images.length > 0).slice(0, 4)

  return (
    <section className="relative overflow-hidden">
      {/* soft pink glow behind the collage */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Branded merchandise for South African businesses
          </span>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Put your brand on{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">everything</span>
              <svg
                aria-hidden
                viewBox="0 0 300 24"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 z-0 h-4 w-full text-accent"
              >
                <path
                  d="M4 16 C 70 4, 150 4, 296 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            people love to use.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Clothing, gifts, bags, drinkware and more, branded with your logo.
            Pick your products and colours, see live stock, choose how you want
            it branded, and we&apos;ll send you a quote.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
              <Link href="/products">
                Browse products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
            >
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>

          {/* Phones: a row of products instead of the collage */}
          <div className="mt-8 grid w-full grid-cols-4 gap-2 sm:hidden">
            {shots.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`flex aspect-square items-center justify-center rounded-2xl bg-white p-2 shadow-md ${TILTS[i]}`}
              >
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-contain" />
              </Link>
            ))}
          </div>

          <dl className="mt-10 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-primary/10 pt-6">
            <div>
              <dt className="text-xs text-muted-foreground">Products</dt>
              <dd className="font-display text-2xl font-semibold text-foreground">
                {total > 0 ? `${formatNumber(total)}+` : "Thousands"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Stock</dt>
              <dd className="font-display text-2xl font-semibold text-foreground">Live</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Branding</dt>
              <dd className="font-display text-2xl font-semibold text-foreground">Custom</dd>
            </div>
          </dl>
        </div>

        {/* Product collage */}
        <div className="relative mx-auto hidden aspect-square w-full max-w-lg sm:block">
          <div
            aria-hidden
            className="absolute inset-6 rounded-full border-2 border-dashed border-accent/40"
          />
          <div className="absolute inset-0 grid grid-cols-2 gap-5 p-2">
            {shots.map((p, i) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`group relative flex items-center justify-center overflow-hidden rounded-3xl bg-white p-4 shadow-xl transition-transform hover:rotate-0 hover:scale-105 ${TILTS[i]}`}
              >
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="h-full w-full object-contain"
                />
              </Link>
            ))}
          </div>
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-lg">
            <Sparkles className="h-4 w-4" />
            Your logo here
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Category tiles                                                     */
/* ------------------------------------------------------------------ */

export function CategoryTiles({
  images,
}: {
  /** One sample product per CATEGORIES entry (same order), or undefined. */
  images: (CatalogueProduct | undefined)[]
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Shop by category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with what you need. Branding options are on every product.
          </p>
        </div>
        <Link
          href="/products"
          className="hidden shrink-0 items-center text-sm font-semibold text-foreground hover:text-accent sm:flex"
        >
          All products
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((cat, i) => {
          const sample = images[i]
          const clearance = cat.slug === "all-clearance-items"
          return (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex aspect-[4/3] items-center justify-center bg-white p-3">
                {sample?.images[0] ? (
                  <img
                    src={sample.images[0]}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="font-display text-4xl font-semibold text-primary/15">
                    {cat.name.charAt(0)}
                  </span>
                )}
              </span>
              <span
                className={`flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-sm font-semibold leading-tight ${
                  clearance ? "bg-accent text-accent-foreground" : "text-foreground"
                }`}
              >
                {cat.name}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  How it works                                                       */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: Search,
    title: "Choose your products",
    text: "Browse clothing, gifts and accessories. Every colour and size shows live stock.",
  },
  {
    icon: Palette,
    title: "Pick your branding",
    text: "Choose where your logo goes and how: embroidery, printing, engraving and more.",
  },
  {
    icon: FileText,
    title: "Get your quote",
    text: "Upload your logo and send the quote basket. We check your artwork and come back with pricing.",
  },
  {
    icon: Truck,
    title: "Approve and receive",
    text: "Approve the proof, and we handle production and delivery.",
  },
]

export function HowItWorksBand() {
  return (
    <section id="how-it-works" className="scroll-mt-32 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From idea to branded, in four steps
          </h2>
          <p className="mt-3 text-primary-foreground/75">
            Build your quote online and our team takes it from there.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={step.title}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <span className="font-display text-5xl font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className="absolute right-6 top-7 h-6 w-6 text-primary-foreground/40" />
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                  {step.text}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Feature strip + closing call to action                             */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Boxes, title: "Live stock", text: "See exactly what's available per colour and size." },
  { icon: Shirt, title: "Big range", text: "Corporate clothing, workwear, gifts, hampers and display." },
  { icon: Palette, title: "Branding your way", text: "Choose the position and method for your logo." },
]

export function FeatureStrip() {
  return (
    <section className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-3 lg:px-8">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Icon className="h-5 w-5 text-accent" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

export function QuoteCallToAction() {
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-10 text-accent-foreground sm:px-10">
        <div
          aria-hidden
          className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10"
        />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Ready to see your logo on it?
            </h2>
            <p className="mt-2 max-w-xl text-accent-foreground/85">
              Add products to your quote basket, upload your logo and we&apos;ll
              send you a quotation.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 shrink-0 rounded-full bg-primary px-6 text-base text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/quote">
              <FileText className="mr-2 h-4 w-4" />
              Open quote basket
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
