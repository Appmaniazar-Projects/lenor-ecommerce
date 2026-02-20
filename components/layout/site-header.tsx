"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingCart,
  FileText,
  User,
  LogOut,
  Menu,
  Package,
  ClipboardList,
  LayoutDashboard,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"
import { useQuote } from "@/contexts/quote-context"
import { useAuth } from "@/contexts/auth-context"
import { NAV_ITEMS, SITE_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useState } from "react"

function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { itemCount: cartCount } = useCart()
  const { itemCount: quoteCount } = useQuote()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">L</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Quote badge */}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/quote-basket" aria-label="View quote basket">
              <FileText className="h-5 w-5" />
              <CartBadge count={quoteCount} />
            </Link>
          </Button>

          {/* Cart badge */}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart" aria-label="View cart">
              <ShoppingCart className="h-5 w-5" />
              <CartBadge count={cartCount} />
            </Link>
          </Button>

          {/* User menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User menu" className="relative">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/quotes" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Quote Requests
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="ml-1 hidden bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                <SheetTitle className="text-base">{SITE_NAME}</SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-3 py-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-accent/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-2 border-t border-border" />
                <Link
                  href="/quote-basket"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4" />
                    Quote Basket
                  </span>
                  {quoteCount > 0 && (
                    <Badge className="bg-accent text-accent-foreground">{quoteCount}</Badge>
                  )}
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingCart className="h-4 w-4" />
                    Shopping Cart
                  </span>
                  {cartCount > 0 && (
                    <Badge className="bg-accent text-accent-foreground">{cartCount}</Badge>
                  )}
                </Link>
                {!isAuthenticated && (
                  <>
                    <div className="my-2 border-t border-border" />
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground"
                    >
                      <User className="h-4 w-4" />
                      Sign In
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
