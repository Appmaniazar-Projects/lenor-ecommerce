import Link from "next/link"
import { SITE_NAME, CATEGORIES, CONTACT_EMAILS } from "@/lib/constants"
import { LenorLogo } from "@/components/shared/lenor-logo"

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" aria-label={`${SITE_NAME} home`} className="w-fit">
              <LenorLogo variant="light" className="h-12" />
            </Link>
            <p className="text-sm leading-relaxed text-primary-foreground/75">
              South Africa{"'"}s trusted B2B supplier of branded promotional
              products. Quality merchandise, competitive pricing, reliable
              delivery.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-primary-foreground">
              Categories
            </h3>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="text-sm text-primary-foreground/75 transition-colors hover:text-accent"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-primary-foreground">
              Company
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-primary-foreground/75 transition-colors hover:text-accent"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/quote"
                  className="text-sm text-primary-foreground/75 transition-colors hover:text-accent"
                >
                  Request a Quote
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-primary-foreground/75 transition-colors hover:text-accent"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-primary-foreground">
              Get In Touch
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-primary-foreground/75">
              <li>
                General:{" "}
                <a href={`mailto:${CONTACT_EMAILS.info}`} className="hover:text-accent">
                  {CONTACT_EMAILS.info}
                </a>
              </li>
              <li>
                Sales and quotes:{" "}
                <a href={`mailto:${CONTACT_EMAILS.sales}`} className="hover:text-accent">
                  {CONTACT_EMAILS.sales}
                </a>
              </li>
              <li>
                Accounts:{" "}
                <a href={`mailto:${CONTACT_EMAILS.accounts}`} className="hover:text-accent">
                  {CONTACT_EMAILS.accounts}
                </a>
              </li>
              <li>+27 11 234 5678</li>
              <li>
                100 Main Rd, Sandton
                <br />
                Johannesburg, 2196
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6">
          <p className="text-center text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} {SITE_NAME} Branding. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
