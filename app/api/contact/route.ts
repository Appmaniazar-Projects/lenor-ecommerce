import { NextResponse } from "next/server"
import { clientIp } from "@/lib/auth"
import { CONTACT_EMAILS } from "@/lib/constants"
import { notifyContactMessage } from "@/lib/notify"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const text = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Limit messages per visitor so the form can't be used to flood info@.
const recent = new Map<string, number[]>()
const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000

function tooMany(key: string): boolean {
  const now = Date.now()
  const times = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (times.length >= LIMIT) {
    recent.set(key, times)
    return true
  }
  times.push(now)
  recent.set(key, times)
  return false
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  // Hidden field: real visitors leave it empty, bots fill it in.
  if (text(body.website)) return NextResponse.json({ ok: true })

  const name = text(body.name, 120)
  const email = text(body.email, 200)
  const subject = text(body.subject, 150)
  const message = text(body.message, 5000)

  if (!name || !subject || !message || !EMAIL.test(email)) {
    return NextResponse.json(
      { error: "Please fill in your name, a valid email, a subject and a message." },
      { status: 400 },
    )
  }

  if (tooMany(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later or email us directly." },
      { status: 429 },
    )
  }

  const sent = await notifyContactMessage({
    name,
    email,
    subject,
    message,
    phone: text(body.phone, 40) || undefined,
    company: text(body.company, 150) || undefined,
  })

  if (!sent) {
    return NextResponse.json(
      { error: `We couldn't send your message. Please email ${CONTACT_EMAILS.info} directly.` },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true })
}
