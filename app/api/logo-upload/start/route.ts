import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getStore } from "@/lib/store"
import { prepareUpload } from "@/lib/uploads"

export const runtime = "nodejs"

/**
 * Step 1 of a direct upload. Checks the name and size, then returns a
 * one-time URL the browser uploads the file to (Supabase Storage).
 * With file storage it answers { mode: "form" }: post to /api/logo-upload.
 */
export async function POST(request: Request) {
  try {
    const store = getStore()
    if (store.kind === "file") {
      return NextResponse.json({ mode: "form" })
    }

    const body = (await request.json().catch(() => ({}))) as {
      fileName?: unknown
      size?: unknown
    }
    const user = await getSessionUser()
    const prepared = prepareUpload(body.fileName, body.size, user?.id ?? null)
    if ("error" in prepared) {
      return NextResponse.json({ error: prepared.error }, { status: 400 })
    }

    const { upload } = prepared
    await store.uploads.insert(upload, false)
    const uploadUrl = await store.uploads.directUploadUrl(upload)

    return NextResponse.json({
      mode: "direct",
      fileId: upload.id,
      uploadUrl,
      contentType: upload.contentType,
    })
  } catch (error) {
    console.error("Logo upload start failed:", error)
    return NextResponse.json(
      { error: "Logo upload failed. Please try again." },
      { status: 500 },
    )
  }
}
