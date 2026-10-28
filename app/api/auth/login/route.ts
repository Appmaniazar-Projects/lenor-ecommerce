import { NextResponse } from "next/server"
import {
  checkCredentials,
  clearLoginFailures,
  clientIp,
  isLoginBlocked,
  recordLoginFailure,
  startSession,
} from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown
    password?: unknown
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    )
  }

  const throttleKey = `${clientIp(request)}|${email}`
  if (isLoginBlocked(throttleKey)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 },
    )
  }

  const user = await checkCredentials(email, password)

  if (!user) {
    recordLoginFailure(throttleKey)
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    )
  }

  clearLoginFailures(throttleKey)
  await startSession(user.id)
  return NextResponse.json({ user })
}
