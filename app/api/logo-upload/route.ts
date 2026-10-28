import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { updateCollection } from "@/lib/demo-store"
import {
  ACCEPTED_LOGO_EXTENSIONS,
  LOGO_RULES,
  MAX_LOGO_BYTES,
  UPLOAD_DIR,
  type StoredUpload,
} from "@/lib/uploads"

export const runtime = "nodejs"

const ACCEPTED_LABEL = "AI, EPS, PDF, SVG, PNG, JPG, WebP or TIFF"

export async function POST(request: Request) {
  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0)
    if (declaredLength > MAX_LOGO_BYTES + 1024 * 1024) {
      return NextResponse.json(
        { error: "The file must be 20 MB or smaller." },
        { status: 413 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose a logo file to upload." },
        { status: 400 },
      )
    }

    if (file.size === 0 || file.size > MAX_LOGO_BYTES) {
      return NextResponse.json(
        { error: "The file must be 20 MB or smaller." },
        { status: 400 },
      )
    }

    const fileName = path.basename(file.name).replace(/[^\w.\- ()]/g, "_").slice(0, 200)
    const extension = path.extname(fileName).toLowerCase()
    const rule = LOGO_RULES[extension]

    if (!rule) {
      return NextResponse.json(
        { error: `Use an ${ACCEPTED_LABEL} file.` },
        { status: 400 },
      )
    }

    const bytes = Buffer.from(await file.arrayBuffer())

    if (!rule.matches(bytes)) {
      return NextResponse.json(
        { error: `This doesn't look like a real ${extension.slice(1).toUpperCase()} file.` },
        { status: 400 },
      )
    }

    const user = await getSessionUser()
    const upload: StoredUpload = {
      id: randomUUID(),
      fileName,
      extension,
      contentType: rule.contentType,
      size: bytes.length,
      kind: rule.kind,
      uploadedAt: new Date().toISOString(),
      userId: user?.id ?? null,
    }

    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, `${upload.id}${extension}`), bytes, {
      flag: "wx",
      mode: 0o600,
    })
    await updateCollection<StoredUpload, void>("uploads", (uploads) => {
      uploads.push(upload)
    })

    return NextResponse.json(
      {
        success: true,
        fileId: upload.id,
        fileName: upload.fileName,
        kind: upload.kind,
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

export function GET() {
  return NextResponse.json({ accepted: ACCEPTED_LOGO_EXTENSIONS, maxBytes: MAX_LOGO_BYTES })
}
