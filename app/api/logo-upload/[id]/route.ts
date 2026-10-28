import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { findUpload, readUploadFile } from "@/lib/uploads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Download an uploaded logo. Lenor admins, or the customer who uploaded it.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  const { id } = await params
  const upload = await findUpload(id)

  const allowed =
    upload && user && (user.isAdmin || (upload.userId && upload.userId === user.id))

  if (!upload || !allowed) {
    return NextResponse.json({ error: "File not found." }, { status: 404 })
  }

  const bytes = await readUploadFile(upload)

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": upload.contentType,
      // Always download, never render: SVG and PDF can carry scripts.
      "Content-Disposition": `attachment; filename="${upload.fileName.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  })
}
