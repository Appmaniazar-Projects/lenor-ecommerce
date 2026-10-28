import { promises as fs } from "node:fs"
import path from "node:path"

/**
 * Tiny JSON-file store for orders and quotes while there is no database.
 *
 * - Data lives in ./.data (git-ignored).
 * - Writes are queued so two checkouts can't overwrite each other.
 * - Every caller goes through readAll / update, so swapping this file for
 *   Supabase later does not touch the rest of the app.
 *
 * NOTE: this does not work on serverless hosts with a read-only or
 * ephemeral disk (e.g. Vercel). Move to Supabase before deploying there.
 */

const DATA_DIR = path.join(process.cwd(), ".data")

const g = globalThis as typeof globalThis & {
  __lenorStoreQueue?: Map<string, Promise<unknown>>
}
const queues = (g.__lenorStoreQueue ??= new Map())

function fileFor(collection: string) {
  return path.join(DATA_DIR, `${collection}.json`)
}

export async function readAll<T>(collection: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(fileFor(collection), "utf8")
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}

/** Read-modify-write one collection, one caller at a time. */
export function update<T, R>(
  collection: string,
  mutate: (items: T[]) => { items: T[]; result: R }
): Promise<R> {
  const previous = queues.get(collection) ?? Promise.resolve()

  const next = previous.catch(() => undefined).then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const { items, result } = mutate(await readAll<T>(collection))

    // Write to a temp file first so a crash can't leave half a JSON file.
    const target = fileFor(collection)
    const tmp = `${target}.${process.pid}.tmp`
    await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8")
    await fs.rename(tmp, target)

    return result
  })

  queues.set(collection, next)
  return next
}
