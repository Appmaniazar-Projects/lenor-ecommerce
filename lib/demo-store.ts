import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

/**
 * Simple JSON-file storage under .data/. Fine for one server process on the
 * VPS; move to a database (e.g. Supabase) before running several instances.
 */
const dataDirectory = path.join(process.cwd(), ".data")

export async function readCollection<T>(name: string): Promise<T[]> {
  await mkdir(dataDirectory, { recursive: true })

  const filePath = path.join(dataDirectory, `${name}.json`)

  try {
    const contents = await readFile(filePath, "utf8")
    const parsed: unknown = JSON.parse(contents)

    if (!Array.isArray(parsed)) {
      throw new Error(`Invalid data file: ${name}.json`)
    }

    return parsed as T[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []
    }

    throw error
  }
}

export async function writeCollection<T>(
  name: string,
  records: T[],
): Promise<void> {
  await mkdir(dataDirectory, { recursive: true })

  const filePath = path.join(dataDirectory, `${name}.json`)
  const temporaryPath = `${filePath}.${process.pid}.tmp`

  await writeFile(temporaryPath, JSON.stringify(records, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  })
  await rename(temporaryPath, filePath)
}

// Writes to the same file are queued, so two requests arriving together
// can't overwrite each other's records.
const queues = new Map<string, Promise<unknown>>()

export function updateCollection<T, R>(
  name: string,
  change: (records: T[]) => R | Promise<R>,
): Promise<R> {
  const previous = queues.get(name) ?? Promise.resolve()

  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const records = await readCollection<T>(name)
      const result = await change(records)
      await writeCollection(name, records)
      return result
    })

  queues.set(name, next)
  return next
}
