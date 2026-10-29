import "server-only"

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { readCollection, updateCollection } from "@/lib/demo-store"
import type { StoredOrder, StoredQuote, StoredUser } from "@/lib/records"
import type { StoredUpload } from "@/lib/uploads"
import type { Store } from "./types"

const DATA_DIR = path.join(process.cwd(), ".data")
const UPLOAD_DIR = path.join(DATA_DIR, "uploads")

type FileUpload = StoredUpload & { verified?: boolean }

const newestFirst = <T extends { date: string }>(items: T[]) =>
  [...items].sort((a, b) => b.date.localeCompare(a.date))

function uploadPath(upload: StoredUpload) {
  return path.join(UPLOAD_DIR, `${upload.id}${upload.extension}`)
}

/** JSON files under .data/ (local development and the VPS). */
export const fileStore: Store = {
  kind: "file",

  users: {
    insert: (user) =>
      updateCollection<StoredUser, boolean>("users", (users) => {
        if (users.some((u) => u.email === user.email)) return false
        users.push(user)
        return true
      }),
    byEmail: async (email) =>
      (await readCollection<StoredUser>("users")).find((u) => u.email === email) ?? null,
    byId: async (id) =>
      (await readCollection<StoredUser>("users")).find((u) => u.id === id) ?? null,
  },

  quotes: {
    insert: (quote) =>
      updateCollection<StoredQuote, void>("quotes", (quotes) => {
        quotes.push(quote)
      }),
    list: async (userId) =>
      newestFirst(
        (await readCollection<StoredQuote>("quotes")).filter(
          (q) => userId === null || q.userId === userId,
        ),
      ),
    get: async (key) =>
      (await readCollection<StoredQuote>("quotes")).find(
        (q) => q.id === key || q.quoteNumber === key,
      ) ?? null,
  },

  orders: {
    insert: (order) =>
      updateCollection<StoredOrder, void>("orders", (orders) => {
        orders.push(order)
      }),
    list: async (userId) =>
      newestFirst(
        (await readCollection<StoredOrder>("orders")).filter(
          (o) => userId === null || o.userId === userId,
        ),
      ),
    get: async (key) =>
      (await readCollection<StoredOrder>("orders")).find(
        (o) => o.id === key || o.orderNumber === key,
      ) ?? null,
  },

  uploads: {
    insert: (upload, verified) =>
      updateCollection<FileUpload, void>("uploads", (uploads) => {
        uploads.push({ ...upload, verified })
      }),
    get: async (id, includeUnverified = false) => {
      const found = (await readCollection<FileUpload>("uploads")).find((u) => u.id === id)
      // Older records have no flag; they were checked before saving.
      if (!found || (!includeUnverified && found.verified === false)) return null
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { verified, ...upload } = found
      return upload
    },
    markVerified: (id, size) =>
      updateCollection<FileUpload, void>("uploads", (uploads) => {
        const found = uploads.find((u) => u.id === id)
        if (found) Object.assign(found, { verified: true, size })
      }),
    remove: async (upload) => {
      await rm(uploadPath(upload), { force: true })
      await updateCollection<FileUpload, void>("uploads", (uploads) => {
        const index = uploads.findIndex((u) => u.id === upload.id)
        if (index >= 0) uploads.splice(index, 1)
      })
    },
    saveFile: async (upload, bytes) => {
      await mkdir(UPLOAD_DIR, { recursive: true })
      await writeFile(uploadPath(upload), bytes, { flag: "wx", mode: 0o600 })
    },
    readFile: (upload) => readFile(uploadPath(upload)),
    directUploadUrl: async () => null,
  },

  cache: {
    read: async (key) => {
      try {
        return await readFile(path.join(DATA_DIR, key))
      } catch {
        return null
      }
    },
    write: async (key, bytes) => {
      await mkdir(DATA_DIR, { recursive: true })
      const target = path.join(DATA_DIR, key)
      const tmp = `${target}.${process.pid}.tmp`
      await writeFile(tmp, bytes)
      await rename(tmp, target)
    },
  },
}
