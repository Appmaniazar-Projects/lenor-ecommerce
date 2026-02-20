import Link from "next/link"
import { SITE_NAME, CATEGORIES } from "@/lib/constants"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-sm font-bold text-primary-foreground">L</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {SITE_NAME}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              South Africa{"'"}s trusted B2B supplier of branded promotional
              products. Quality merchandise, competitive pricing, reliable
              delivery.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Categories
            </h3>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Company
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/quote"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Request a Quote
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Get In Touch
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>info@lenor.co.za</li>
              <li>+27 11 234 5678</li>
              <li>
                100 Main Rd, Sandton
                <br />
                Johannesburg, 2196
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
