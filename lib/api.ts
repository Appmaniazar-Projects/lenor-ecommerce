/**
 * Mock API layer -- simulates async calls with small delays.
 * Each function can be swapped for real Supabase queries later
 * without changing any component code.
 */

import {
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_QUOTES,
  MOCK_USER,
  type Product,
  type Order,
  type QuoteRequest,
  type UserProfile,
} from "./mock-data"
import type { CategoryId } from "./constants"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */

export interface ProductFilters {
  search?: string
  category?: CategoryId
  minPrice?: number
  maxPrice?: number
  stockOnly?: boolean
  page?: number
  perPage?: number
}

export interface PaginatedProducts {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedProducts> {
  await delay(200)

  let results = [...MOCK_PRODUCTS]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    )
  }

  if (filters.category) {
    results = results.filter((p) => p.category === filters.category)
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((p) => p.price >= filters.minPrice!)
  }

  if (filters.maxPrice !== undefined) {
    results = results.filter((p) => p.price <= filters.maxPrice!)
  }

  if (filters.stockOnly) {
    results = results.filter((p) => p.stockLevel !== "out-of-stock")
  }

  const total = results.length
  const page = filters.page ?? 1
  const perPage = filters.perPage ?? 12
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage

  return {
    products: results.slice(start, start + perPage),
    total,
    page,
    totalPages,
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  await delay(150)
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await delay(150)
  return MOCK_PRODUCTS.filter((p) => p.featured)
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

export async function getOrders(): Promise<Order[]> {
  await delay(200)
  return [...MOCK_ORDERS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export async function getOrder(id: string): Promise<Order | null> {
  await delay(150)
  return MOCK_ORDERS.find((o) => o.id === id) ?? null
}

/* ------------------------------------------------------------------ */
/*  Quote Requests                                                     */
/* ------------------------------------------------------------------ */

export async function getQuotes(): Promise<QuoteRequest[]> {
  await delay(200)
  return [...MOCK_QUOTES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export async function getQuote(id: string): Promise<QuoteRequest | null> {
  await delay(150)
  return MOCK_QUOTES.find((q) => q.id === id) ?? null
}

export interface SubmitQuoteData {
  items: {
    productId: string
    quantity: number
    color: string
    size: string
    brandingNotes: string
    brandingPosition: string
  }[]
  contactName: string
  contactEmail: string
  companyName: string
  deadline: string
  specialInstructions: string
}

export async function submitQuoteRequest(
  _data: SubmitQuoteData
): Promise<{ success: boolean; quoteNumber: string }> {
  await delay(500)
  const num = Math.floor(Math.random() * 900) + 100
  return { success: true, quoteNumber: `QR-2026-${num}` }
}

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

export interface CheckoutData {
  items: {
    productId: string
    quantity: number
    color: string
    size: string
    unitPrice: number
  }[]
  billingAddress: string
  shippingAddress: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

export async function createOrder(
  _data: CheckoutData
): Promise<{ success: boolean; orderNumber: string }> {
  await delay(500)
  const num = Math.floor(Math.random() * 900) + 100
  return { success: true, orderNumber: `LNR-2026-${num}` }
}

/* ------------------------------------------------------------------ */
/*  Auth (mock)                                                        */
/* ------------------------------------------------------------------ */

export async function login(
  email: string,
  _password: string
): Promise<{ success: boolean; user: UserProfile | null }> {
  await delay(400)
  if (email) {
    return { success: true, user: { ...MOCK_USER, email } }
  }
  return { success: false, user: null }
}

export interface RegisterData {
  email: string
  password: string
  name: string
  companyName: string
  vatNumber?: string
  phone: string
}

export async function register(
  data: RegisterData
): Promise<{ success: boolean; user: UserProfile | null }> {
  await delay(400)
  return {
    success: true,
    user: {
      ...MOCK_USER,
      email: data.email,
      name: data.name,
      companyName: data.companyName,
      vatNumber: data.vatNumber ?? "",
      phone: data.phone,
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Admin                                                              */
/* ------------------------------------------------------------------ */

export interface AdminStats {
  totalOrders: number
  totalRevenue: number
  pendingQuotes: number
  activeOrders: number
}

export async function getAdminStats(): Promise<AdminStats> {
  await delay(200)
  return {
    totalOrders: MOCK_ORDERS.length,
    totalRevenue: MOCK_ORDERS.reduce((sum, o) => sum + o.total, 0),
    pendingQuotes: MOCK_QUOTES.filter((q) => q.status === "Pending").length,
    activeOrders: MOCK_ORDERS.filter(
      (o) => o.status !== "Delivered" && o.status !== "Cancelled"
    ).length,
  }
}
