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
  featured?: boolean
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

  if (filters.featured) {
  params.set("featured", "true");
}

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
  const result = await getProducts({ featured: true, perPage: 8 })
  return result.products
}


/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof result?.error === "string"
        ? result.error
        : typeof result?.message === "string"
          ? result.message
          : `Request failed (${response.status})`

    throw new Error(message)
  }

  return result as T
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

export async function getOrders(email?: string): Promise<Order[]> {
  const params = new URLSearchParams()

  if (email) params.set("email", email)

  const query = params.size ? `?${params.toString()}` : ""

  const result = await apiRequest<Order[] | { orders: Order[] }>(
    `/api/orders${query}`
  )

  return Array.isArray(result) ? result : result.orders
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const result = await apiRequest<Order | { order: Order }>(
      `/api/orders/${encodeURIComponent(id)}`
    )

    return "order" in result ? result.order : result
  } catch (error) {
    if (
      error instanceof Error &&
      /404|not found/i.test(error.message)
    ) {
      return null
    }

    throw error
  }
}

/* ------------------------------------------------------------------ */
/*  Quote Requests                                                     */
/* ------------------------------------------------------------------ */

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
  logoFileId?: string
}


export async function getQuotes(email?: string): Promise<QuoteRequest[]> {
  const params = new URLSearchParams()

  if (email) params.set("email", email)

  const query = params.size ? `?${params.toString()}` : ""

  const result = await apiRequest<
    QuoteRequest[] | { quotes: QuoteRequest[] }
  >(`/api/quotes${query}`)

  return Array.isArray(result) ? result : result.quotes
}

export async function getQuote(
  id: string
): Promise<QuoteRequest | null> {
  try {
    const result = await apiRequest<
      QuoteRequest | { quote: QuoteRequest }
    >(`/api/quotes/${encodeURIComponent(id)}`)

    return "quote" in result ? result.quote : result
  } catch (error) {
    if (
      error instanceof Error &&
      /404|not found/i.test(error.message)
    ) {
      return null
    }

    throw error
  }
}

export async function submitQuoteRequest(
  data: SubmitQuoteData
): Promise<{ success: boolean; quoteNumber: string }> {
  const result = await apiRequest<{
    success?: boolean
    quoteNumber?: string
    quote?: { quoteNumber?: string; id?: string }
  }>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(data),
  })

  const quoteNumber =
    result.quoteNumber ??
    result.quote?.quoteNumber ??
    result.quote?.id

  if (!quoteNumber) {
    throw new Error("Quote was submitted but no quote number was returned.")
  }

  return {
    success: result.success ?? true,
    quoteNumber,
  }
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
  data: CheckoutData
): Promise<{ success: boolean; orderNumber: string }> {
  // Never trust a price supplied by the browser.
  // The checkout API must look up current prices and stock itself.
  const payload = {
    items: data.items.map(({ productId, quantity, color, size }) => ({
      productId,
      quantity,
      color,
      size,
    })),
    billingAddress: data.billingAddress,
    shippingAddress: data.shippingAddress,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
  }

  const result = await apiRequest<{
    success?: boolean
    orderNumber?: string
    order?: { orderNumber?: string; id?: string }
  }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const orderNumber =
    result.orderNumber ??
    result.order?.orderNumber ??
    result.order?.id

  if (!orderNumber) {
    throw new Error("Order was created but no order number was returned.")
  }

  return {
    success: result.success ?? true,
    orderNumber,
  }
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
