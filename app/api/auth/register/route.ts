import { NextResponse } from "next/server"
import { createUser, startSession } from "@/lib/auth"

export const runtime = "nodejs"

const text = (value: unknown, max = 200) =>
  typeof value === "string" ? value.trim().slice(0, max) : ""

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const email = text(body.email).toLowerCase()
  const password = typeof body.password === "string" ? body.password : ""
  const name = text(body.name)
  const companyName = text(body.companyName)
  const phone = text(body.phone, 40)
  const vatNumber = text(body.vatNumber, 40)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    )
  }
  if (name.length < 2 || companyName.length < 2 || phone.length < 10) {
    return NextResponse.json(
      { error: "Name, company name and phone number are required." },
      { status: 400 },
    )
  }

  const user = await createUser({ email, password, name, companyName, phone, vatNumber })

  if (user === "exists") {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 },
    )
  }

  await startSession(user.id)
  return NextResponse.json({ user }, { status: 201 })
}
