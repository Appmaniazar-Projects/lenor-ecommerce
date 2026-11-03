import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ProductTile } from "@/components/products/product-tile"
import {
  CategoryTiles,
  FeatureStrip,
  HowItWorksBand,
  LandingHero,
  QuoteCallToAction,
} from "@/components/home/landing"
import { queryCatalogue, type CatalogueProduct } from "@/lib/catalogue"
import { CATEGORIES } from "@/lib/constants"
import { forViewer } from "@/lib/pricing-visibility"


// Amrod can take a while on a fresh server; give it time.
export const maxDuration = 60

// Stock and prices change, so never freeze this page at build time.
export const dynamic = "force-dynamic"

const ROW_SIZE = 10

// Category rows shown under the promotion rows. Edit freely.
const FEATURED_CATEGORIES = [
  "corporate-gifts",
  "corporate-clothing",
  "headwear-and-accessories",
]

const hasImage = (p: CatalogueProduct) => p.images.length > 0

async function loadRow(query: Parameters<typeof queryCatalogue>[0]) {
  const result = await queryCatalogue({
    page: 1,
    perPage: 30,
    stockOnly: true,
    includeFacets: false,
    ...query,
  })
  return forViewer(result.products.filter(hasImage).slice(0, ROW_SIZE))
}

function ProductRow({
  title,
  href,
  products,
}: {
  title: string
  href: string
  products: CatalogueProduct[]
}) {
  if (products.length === 0) return null

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <Link
          href={href}
          className="flex items-center text-sm font-medium text-accent hover:underline"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductTile product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const [promotion, newest, total, ...rest] = await Promise.all([
    loadRow({ promotionOnly: true }),
    loadRow({ sort: "newest" }),
    queryCatalogue({ page: 1, perPage: 1, includeFacets: false }).then((r) => r.total),
    // One product photo per category for the tiles.
    ...CATEGORIES.map((cat) =>
      loadRow({ category: cat.slug, perPage: 6 }).then((p) => p.slice(0, 1))
    ),
    ...FEATURED_CATEGORIES.map((slug) => loadRow({ category: slug })),
  ])

  const tileImages = rest.slice(0, CATEGORIES.length)
  const categoryRows = rest.slice(CATEGORIES.length)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="flex flex-col gap-12 pb-16 lg:gap-16">
        <LandingHero
          total={total}
          products={[...promotion, ...newest].filter(
            (p, i, all) => all.findIndex((q) => q.id === p.id) === i
          )}
        />

        <FeatureStrip />

        <CategoryTiles images={tileImages.map((row) => row?.[0])} />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 lg:px-8">
          <ProductRow title="On Promotion" href="/products?promotion=true" products={promotion} />
          <ProductRow title="New Arrivals" href="/products?sort=newest" products={newest} />
        </div>

        <HowItWorksBand />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 lg:px-8">
          {FEATURED_CATEGORIES.map((slug, i) => (
            <ProductRow
              key={slug}
              title={CATEGORIES.find((c) => c.slug === slug)?.name ?? slug}
              href={`/products?category=${slug}`}
              products={categoryRows[i] ?? []}
            />
          ))}
        </div>

        <QuoteCallToAction />
      </main>

      <SiteFooter />
    </div>
  )
}
