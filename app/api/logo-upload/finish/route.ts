import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getStore } from "@/lib/store"
import { checkUploadBytes } from "@/lib/uploads"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Step 2 of a direct upload: the file is in storage, so check its real
 * size and contents. Bad files are deleted; good ones can go on a quote.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { fileId?: unknown }
  const fileId = typeof body.fileId === "string" ? body.fileId : ""
  const store = getStore()

  try {
    const upload = await store.uploads.get(fileId, true)
    const user = await getSessionUser()

    // A signed-in customer's upload can only be finished by them.
    if (!upload || (upload.userId && upload.userId !== user?.id)) {
      return NextResponse.json({ error: "Upload not found. Please try again." }, { status: 404 })
    }

    let bytes: Buffer
    try {
      bytes = await store.uploads.readFile(upload)
    } catch {
      return NextResponse.json(
        { error: "The file didn't arrive. Please try again." },
        { status: 400 },
      )
    }

    const problem = checkUploadBytes(upload, bytes)
    if (problem) {
      await store.uploads.remove(upload).catch(() => undefined)
      return NextResponse.json({ error: problem }, { status: 400 })
    }

    await store.uploads.markVerified(upload.id, bytes.length)

    return NextResponse.json({
      success: true,
      fileId: upload.id,
      fileName: upload.fileName,
      kind: upload.kind,
    })
  } catch (error) {
    console.error("Logo upload finish failed:", error)
    return NextResponse.json(
      { error: "Logo upload failed. Please try again." },
      { status: 500 },
    )
  }
}
