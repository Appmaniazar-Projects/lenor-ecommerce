import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { StoredOrder, StoredQuote, StoredUser } from "@/lib/records"
import type { StoredUpload } from "@/lib/uploads"
import type { Store } from "./types"

/**
 * Supabase backend: Postgres tables (supabase/schema.sql) and two private
 * Storage buckets. Uses the service role key, so it must only ever run on
 * the server. The key never reaches the browser.
 */

const LOGO_BUCKET = "lenor-logos"
const CACHE_BUCKET = "lenor-cache"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LIST_LIMIT = 500

export function supabaseUrl(): string | undefined {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() || undefined
}

function serviceKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  )?.trim() || undefined
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && serviceKey())
}

let client: SupabaseClient | null = null

function db(): SupabaseClient {
  if (!client) {
    const url = supabaseUrl()
    const key = serviceKey()
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set")
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

function fail(action: string, error: { message: string; code?: string } | null): never {
  throw new Error(`Supabase ${action} failed: ${error?.message ?? "unknown error"}`)
}

async function rows<T>(
  query: PromiseLike<{ data: { data: unknown }[] | null; error: { message: string } | null }>,
  action: string,
): Promise<T[]> {
  const { data, error } = await query
  if (error) fail(action, error)
  return (data ?? []).map((row) => row.data as T)
}

async function one<T>(
  query: PromiseLike<{ data: { data: unknown } | null; error: { message: string } | null }>,
  action: string,
): Promise<T | null> {
  const { data, error } = await query
  if (error) fail(action, error)
  return data ? (data.data as T) : null
}

async function insert(table: string, row: Record<string, unknown>, action: string) {
  const { error } = await db().from(table).insert(row)
  if (error) fail(action, error)
}

/** By id when it looks like one, otherwise by the human-readable number. */
function byKey(table: string, numberColumn: string, key: string) {
  const query = db().from(table).select("data")
  return (UUID.test(key) ? query.eq("id", key) : query.eq(numberColumn, key)).maybeSingle()
}

function listFor(table: string, userId: string | null) {
  const query = db()
    .from(table)
    .select("data")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)
  return userId === null ? query : query.eq("user_id", userId)
}

const logoPath = (upload: StoredUpload) => `${upload.id}${upload.extension}`

export const supabaseStore: Store = {
  kind: "supabase",

  users: {
    insert: async (user: StoredUser) => {
      const { error } = await db()
        .from("lenor_users")
        .insert({ id: user.id, email: user.email, data: user, created_at: user.createdAt })
      if (!error) return true
      if (error.code === "23505") return false // email already registered
      fail("create account", error)
    },
    byEmail: (email) =>
      one<StoredUser>(
        db().from("lenor_users").select("data").eq("email", email).maybeSingle(),
        "find account",
      ),
    byId: (id) =>
      UUID.test(id)
        ? one<StoredUser>(
            db().from("lenor_users").select("data").eq("id", id).maybeSingle(),
            "load account",
          )
        : Promise.resolve(null),
  },

  quotes: {
    insert: (quote: StoredQuote) =>
      insert(
        "lenor_quotes",
        {
          id: quote.id,
          quote_number: quote.quoteNumber,
          user_id: quote.userId,
          data: quote,
          created_at: quote.date,
        },
        "save quote",
      ),
    list: (userId) => rows<StoredQuote>(listFor("lenor_quotes", userId), "list quotes"),
    get: (key) => one<StoredQuote>(byKey("lenor_quotes", "quote_number", key), "load quote"),
  },

  orders: {
    insert: (order: StoredOrder) =>
      insert(
        "lenor_orders",
        {
          id: order.id,
          order_number: order.orderNumber,
          user_id: order.userId,
          data: order,
          created_at: order.date,
        },
        "save order",
      ),
    list: (userId) => rows<StoredOrder>(listFor("lenor_orders", userId), "list orders"),
    get: (key) => one<StoredOrder>(byKey("lenor_orders", "order_number", key), "load order"),
  },

  uploads: {
    insert: (upload, verified) =>
      insert(
        "lenor_uploads",
        { id: upload.id, user_id: upload.userId, verified, data: upload, created_at: upload.uploadedAt },
        "record upload",
      ),
    get: async (id, includeUnverified = false) => {
      if (!UUID.test(id)) return null
      let query = db().from("lenor_uploads").select("data").eq("id", id)
      if (!includeUnverified) query = query.eq("verified", true)
      return one<StoredUpload>(query.maybeSingle(), "load upload")
    },
    markVerified: async (id, size) => {
      const existing = await supabaseStore.uploads.get(id, true)
      if (!existing) return
      const { error } = await db()
        .from("lenor_uploads")
        .update({ verified: true, data: { ...existing, size } })
        .eq("id", id)
      if (error) fail("confirm upload", error)
    },
    remove: async (upload) => {
      await db().storage.from(LOGO_BUCKET).remove([logoPath(upload)])
      const { error } = await db().from("lenor_uploads").delete().eq("id", upload.id)
      if (error) fail("remove upload", error)
    },
    saveFile: async (upload, bytes) => {
      const { error } = await db()
        .storage.from(LOGO_BUCKET)
        .upload(logoPath(upload), bytes, { contentType: upload.contentType, upsert: false })
      if (error) fail("store logo", error)
    },
    readFile: async (upload) => {
      const { data, error } = await db().storage.from(LOGO_BUCKET).download(logoPath(upload))
      if (error || !data) fail("read logo", error)
      return Buffer.from(await data.arrayBuffer())
    },
    directUploadUrl: async (upload) => {
      const { data, error } = await db()
        .storage.from(LOGO_BUCKET)
        .createSignedUploadUrl(logoPath(upload))
      if (error || !data) fail("prepare logo upload", error)
      return data.signedUrl
    },
  },

  cache: {
    read: async (key) => {
      const { data, error } = await db().storage.from(CACHE_BUCKET).download(key)
      if (error || !data) return null
      return Buffer.from(await data.arrayBuffer())
    },
    write: async (key, bytes) => {
      const { error } = await db()
        .storage.from(CACHE_BUCKET)
        .upload(key, bytes, { contentType: "application/gzip", upsert: true })
      if (error) fail("save cache", error)
    },
  },
}
