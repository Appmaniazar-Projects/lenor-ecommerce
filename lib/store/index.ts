import "server-only"

import { fileStore } from "./file-store"
import { supabaseConfigured, supabaseStore } from "./supabase-store"
import type { Store } from "./types"

export type { Store } from "./types"

/** True on Vercel, where the disk is read-only and wiped between requests. */
export const isServerless = Boolean(process.env.VERCEL)

/**
 * Supabase when it's configured, otherwise files under .data/.
 * On Vercel, files would be lost, so Supabase is required there.
 */
export function getStore(): Store {
  if (supabaseConfigured()) return supabaseStore
  if (isServerless) {
    throw new Error(
      "Storage is not set up: add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "to the Vercel project's environment variables (see DEPLOY.md).",
    )
  }
  return fileStore
}
