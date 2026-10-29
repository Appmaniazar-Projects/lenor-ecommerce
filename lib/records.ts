import "server-only"

import type { Order, QuoteRequest, UserProfile } from "@/lib/mock-data"
import type { SessionUser } from "@/lib/auth"

/** A customer account, including the password hash. Never sent to browsers. */
export interface StoredUser extends UserProfile {
  passwordHash: string
  passwordSalt: string
  createdAt: string
}

/** A saved order (Supabase lenor_orders, or .data/orders.json). */
export type StoredOrder = Order & {
  userId: string
  contactEmail: string
  contactName: string
  contactPhone: string
  billingAddress: string
}

/** A saved quote request. `userId` is null for guest quotes. */
export type StoredQuote = QuoteRequest & {
  userId: string | null
  logoFileName?: string
}

export function canView(
  record: { userId?: string | null },
  user: SessionUser | null,
): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  return Boolean(record.userId) && record.userId === user.id
}

/** Strip internal fields before sending a record to the browser. */
export function publicRecord<T extends { userId?: string | null }>(
  record: T,
): Omit<T, "userId"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId, ...rest } = record
  return rest
}
