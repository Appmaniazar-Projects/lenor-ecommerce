"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  FileText,
  User,
  LogOut,
  Menu,
  Package,
  ClipboardList,
  Search,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/contexts/cart-context"
import { useQuote } from "@/contexts/quote-context"
import { useAuth } from "@/contexts/auth-context"
import { CATEGORIES, SITE_NAME } from "@/lib/constants"

const CLEARANCE_SLUG = "all-clearance-items"

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground">
      {count > 99 ? "99+" : count}
    </span>
  )
}

function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products")
  }

  return (
    <form onSubmit={submit} role="search" className={`flex ${className}`}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, brands or codes"
        aria-label="Search products"
        className="h-10 min-w-0 flex-1 rounded-l-md border-0 bg-white px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-accent"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-10 w-12 items-center justify-center rounded-r-md bg-accent text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  )
}

export function SiteHeader() {
  const { itemCount: cartCount } = useCart()
  const { itemCount: quoteCount } = useQuote()
  const { user, isAuthenticated, logout } = useAuth()

  const iconLink =
    "relative flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* Row 1: logo, search, account, quote, cart */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 lg:gap-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${SITE_NAME} home`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-lg font-bold text-primary">
              L
            </span>
            <span className="hidden text-xl font-bold tracking-tight sm:inline">
              {SITE_NAME}
            </span>
          </Link>

          <SearchBar className="hidden flex-1 md:flex md:max-w-3xl" />

          <div className="ml-auto flex items-center gap-1">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={iconLink} aria-label="Account menu">
                    <User className="h-5 w-5" />
                    <span className="hidden max-w-28 truncate lg:inline">
                      {user?.name?.split(" ")[0] ?? "Account"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders?tab=quotes" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Quote Requests
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void logout()}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className={iconLink}>
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">Sign In</span>
              </Link>
            )}

            <Link href="/quote" className={iconLink} aria-label="Quote basket">
              <FileText className="h-5 w-5" />
              <span className="hidden lg:inline">Quote</span>
              <CountBadge count={quoteCount} />
            </Link>

            <Link href="/cart" className={iconLink} aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden lg:inline">Cart</span>
              <CountBadge count={cartCount} />
            </Link>
          </div>
        </div>

        {/* Search on its own row for phones */}
        <div className="px-4 pb-2.5 md:hidden">
          <SearchBar />
        </div>
      </div>

      {/* Row 2: categories */}
      <nav aria-label="Categories" className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 lg:px-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-2.5 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Menu className="h-4 w-4" />
                All Categories
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem asChild>
                <Link href="/products">All Products</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CATEGORIES.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={cat.slug === CLEARANCE_SLUG ? "font-semibold text-red-600" : ""}
                  >
                    {cat.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`shrink-0 rounded-md px-2.5 py-2.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  cat.slug === CLEARANCE_SLUG
                    ? "font-semibold text-red-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}