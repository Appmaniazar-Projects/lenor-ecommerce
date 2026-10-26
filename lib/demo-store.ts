
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

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
  const temporaryPath = `${filePath}.tmp`

  await writeFile(temporaryPath, JSON.stringify(records, null, 2), "utf8")
  await rename(temporaryPath, filePath)
}
