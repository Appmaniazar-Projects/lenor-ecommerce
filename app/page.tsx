import Link from "next/link"
import { ChevronRight, FileText } from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ProductTile } from "@/components/products/product-tile"
import { Button } from "@/components/ui/button"
import { queryCatalogue, type CatalogueProduct } from "@/lib/catalogue"
import { CATEGORIES } from "@/lib/constants"

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
  return result.products.filter(hasImage).slice(0, ROW_SIZE)
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
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <Link
          href={href}
          className="flex items-center text-sm font-medium text-primary hover:underline"
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
    <div className="min-h-screen bg-neutral-100">
      <SiteHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-8">
        {/* Shop by category */}
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h1 className="text-lg font-bold text-foreground">Shop by category</h1>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">
              Browse all {total.toLocaleString("en-ZA")} products
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CATEGORIES.map((cat, i) => {
              const sample = tileImages[i]?.[0]
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {sample ? (
                      <img
                        src={sample.images[0]}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground/40">
                        {cat.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-sm font-medium leading-tight group-hover:text-primary ${
                      cat.slug === "all-clearance-items" ? "text-red-600" : "text-foreground"
                    }`}
                  >
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <ProductRow title="On Promotion" href="/products?promotion=true" products={promotion} />
        <ProductRow title="New Arrivals" href="/products?sort=newest" products={newest} />

        {FEATURED_CATEGORIES.map((slug, i) => (
          <ProductRow
            key={slug}
            title={CATEGORIES.find((c) => c.slug === slug)?.name ?? slug}
            href={`/products?category=${slug}`}
            products={categoryRows[i] ?? []}
          />
        ))}

        {/* Branded orders go through the quote basket */}
        <section className="flex flex-col items-start justify-between gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-foreground">Need it branded?</h2>
            <p className="text-sm text-muted-foreground">
              Add items to your quote basket and we will come back to you with pricing for your branding.
            </p>
          </div>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/quote-basket">
              <FileText className="mr-2 h-4 w-4" />
              Open quote basket
            </Link>
          </Button>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
