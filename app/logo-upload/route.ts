
import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose a logo file to upload." },
        { status: 400 },
      )
    }

    const extension = ALLOWED_TYPES[file.type]

    if (!extension) {
      return NextResponse.json(
        { error: "Use a PNG, JPG, WebP or PDF file." },
        { status: 400 },
      )
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The file must be smaller than 5 MB." },
        { status: 400 },
      )
    }

    const fileId = randomUUID()
    const uploadDirectory = path.join(process.cwd(), ".data", "uploads")

    await mkdir(uploadDirectory, { recursive: true })
    await writeFile(
      path.join(uploadDirectory, `${fileId}${extension}`),
      Buffer.from(await file.arrayBuffer()),
      { flag: "wx" },
    )

    return NextResponse.json(
      {
        success: true,
        fileId,
        fileName: path.basename(file.name).slice(0, 200),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Logo upload failed:", error)

    return NextResponse.json(
      { error: "Logo upload failed. Please try again." },
      { status: 500 },
    )
  }
}
