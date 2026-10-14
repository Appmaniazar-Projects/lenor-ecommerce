/**
 * Mock API layer -- simulates async calls with small delays.
 * Each function can be swapped for real Supabase queries later
 * without changing any component code.
 */

import {
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

async function fetchProducts(): Promise<Product[]> {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000"
      : ""

  const response = await fetch(
    `${baseUrl}/api/products`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products: ${response.status}`
    )
  }

  return response.json()
}


export async function getProducts(
  filters: ProductFilters = {}
): Promise<PaginatedProducts> {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000"
      : "";

  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("perPage", String(filters.perPage ?? 12));

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.stockOnly) {
    params.set("stockOnly", "true");
  }

  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  const response = await fetch(
    `${baseUrl}/api/products?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products: ${response.status}`
    );
  }

  return response.json() as Promise<PaginatedProducts>;
}


export async function getProduct(
  id: string
): Promise<Product | null> {
  const products = await fetchProducts()

  return (
    products.find((product) => product.id === id) ??
    null
  )
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await fetchProducts()

  return products.filter(
    (product) => product.featured
  )
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
