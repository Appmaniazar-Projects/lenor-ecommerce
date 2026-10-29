import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getStore } from "@/lib/store"
import {
  ACCEPTED_LOGO_EXTENSIONS,
  MAX_LOGO_BYTES,
  checkUploadBytes,
  prepareUpload,
} from "@/lib/uploads"

export const runtime = "nodejs"

/**
 * Upload in one request (the file is posted to this route). Used on the VPS
 * and locally. On Vercel requests are capped at about 4.5 MB, so the browser
 * uses /api/logo-upload/start + /finish and uploads straight to Supabase.
 */
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

    const user = await getSessionUser()
    const prepared = prepareUpload(file.name, file.size, user?.id ?? null)
    if ("error" in prepared) {
      return NextResponse.json({ error: prepared.error }, { status: 400 })
    }

    const { upload } = prepared
    const bytes = Buffer.from(await file.arrayBuffer())
    const problem = checkUploadBytes(upload, bytes)
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 })
    }

    upload.size = bytes.length
    const store = getStore()
    await store.uploads.saveFile(upload, bytes)
    await store.uploads.insert(upload, true)

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
