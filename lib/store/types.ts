import type { StoredOrder, StoredQuote, StoredUser } from "@/lib/records"
import type { StoredUpload } from "@/lib/uploads"

/**
 * Where Lenor keeps accounts, quotes, orders, logos and the catalogue cache.
 *
 * Two backends:
 *  - "supabase": Postgres tables + private Storage buckets. Used on Vercel,
 *    where the server has no lasting disk.
 *  - "file": JSON files and folders under .data/. Used locally and on a VPS.
 */
export interface Store {
  readonly kind: "supabase" | "file"

  users: {
    /** False when the email is already registered. */
    insert(user: StoredUser): Promise<boolean>
    byEmail(email: string): Promise<StoredUser | null>
    byId(id: string): Promise<StoredUser | null>
  }

  quotes: {
    insert(quote: StoredQuote): Promise<void>
    /** Newest first. `userId` null = every quote (Lenor admins). */
    list(userId: string | null): Promise<StoredQuote[]>
    /** By id or quote number. */
    get(idOrNumber: string): Promise<StoredQuote | null>
  }

  orders: {
    insert(order: StoredOrder): Promise<void>
    list(userId: string | null): Promise<StoredOrder[]>
    get(idOrNumber: string): Promise<StoredOrder | null>
  }

  uploads: {
    /** Records an upload. Supabase saves it unverified until checked. */
    insert(upload: StoredUpload, verified: boolean): Promise<void>
    /** Only verified uploads, unless `includeUnverified`. */
    get(id: string, includeUnverified?: boolean): Promise<StoredUpload | null>
    markVerified(id: string, size: number): Promise<void>
    remove(upload: StoredUpload): Promise<void>
    saveFile(upload: StoredUpload, bytes: Buffer): Promise<void>
    readFile(upload: StoredUpload): Promise<Buffer>
    /**
     * A one-time URL the browser can PUT the file to directly (Supabase),
     * or null when the browser should post the file to our own API (file).
     */
    directUploadUrl(upload: StoredUpload): Promise<string | null>
  }

  /** Cached files, e.g. the gzipped catalogue snapshot. */
  cache: {
    read(key: string): Promise<Buffer | null>
    write(key: string, bytes: Buffer): Promise<void>
  }
}
