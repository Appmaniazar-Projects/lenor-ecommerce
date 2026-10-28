import "server-only"

import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import { cookies } from "next/headers"
import { readCollection, updateCollection } from "@/lib/demo-store"
import type { UserProfile } from "@/lib/mock-data"

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>

export const SESSION_COOKIE = "lenor_session"
const SESSION_DAYS = 14

interface StoredUser extends UserProfile {
  passwordHash: string
  passwordSalt: string
  createdAt: string
}

export interface SessionUser extends UserProfile {
  isAdmin: boolean
}

/* ------------------------------------------------------------------ */
/*  Secret for signing session cookies                                 */
/* ------------------------------------------------------------------ */

let cachedSecret: Buffer | null = null

/**
 * Uses SESSION_SECRET when set. Otherwise creates a random secret once and
 * keeps it in .data/, so sessions survive restarts on the VPS.
 */
async function getSecret(): Promise<Buffer> {
  if (cachedSecret) return cachedSecret

  const fromEnv = process.env.SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 32) {
    cachedSecret = Buffer.from(fromEnv)
    return cachedSecret
  }

  const secretPath = path.join(process.cwd(), ".data", ".session-secret")
  try {
    cachedSecret = Buffer.from((await readFile(secretPath, "utf8")).trim())
  } catch {
    const generated = randomBytes(48).toString("base64url")
    await mkdir(path.dirname(secretPath), { recursive: true })
    await writeFile(secretPath, generated, { mode: 0o600 })
    cachedSecret = Buffer.from(generated)
  }
  return cachedSecret
}

function sign(value: string, secret: Buffer): string {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

/* ------------------------------------------------------------------ */
/*  Passwords                                                          */
/* ------------------------------------------------------------------ */

async function hashPassword(password: string, salt?: Buffer) {
  const saltBuffer = salt ?? randomBytes(16)
  const hash = await scrypt(password, saltBuffer, 64)
  return { hash: hash.toString("base64"), salt: saltBuffer.toString("base64") }
}

async function verifyPassword(user: StoredUser, password: string) {
  const { hash } = await hashPassword(
    password,
    Buffer.from(user.passwordSalt, "base64"),
  )
  const a = Buffer.from(hash, "base64")
  const b = Buffer.from(user.passwordHash, "base64")
  return a.length === b.length && timingSafeEqual(a, b)
}

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    companyName: user.companyName,
    vatNumber: user.vatNumber,
    phone: user.phone,
    address: user.address,
    isAdmin: adminEmails().has(user.email),
  }
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  companyName: string
  vatNumber?: string
  phone: string
}

export async function createUser(
  input: RegisterInput,
): Promise<SessionUser | "exists"> {
  const email = input.email.trim().toLowerCase()
  const { hash, salt } = await hashPassword(input.password)
  const user: StoredUser = {
    id: randomUUID(),
    email,
    name: input.name.trim(),
    companyName: input.companyName.trim(),
    vatNumber: input.vatNumber?.trim() ?? "",
    phone: input.phone.trim(),
    address: "",
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  }

  const created = await updateCollection<StoredUser, boolean>("users", (users) => {
    if (users.some((u) => u.email === email)) return false
    users.push(user)
    return true
  })

  return created ? toSessionUser(user) : "exists"
}

export async function checkCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const users = await readCollection<StoredUser>("users")
  const user = users.find((u) => u.email === email.trim().toLowerCase())

  if (!user) {
    // Spend the same time as a real check so emails can't be probed.
    await hashPassword(password)
    return null
  }

  return (await verifyPassword(user, password)) ? toSessionUser(user) : null
}

/* ------------------------------------------------------------------ */
/*  Sessions (signed, HttpOnly cookie)                                 */
/* ------------------------------------------------------------------ */

function cookieIsSecure() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://")
}

export async function startSession(userId: string) {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: expires }))
    .toString("base64url")
  const value = `${payload}.${sign(payload, await getSecret())}`

  const jar = await cookies()
  jar.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieIsSecure(),
    path: "/",
    expires: new Date(expires),
  })
}

export async function endSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

/** The signed-in user for this request, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  if (!raw) return null

  const [payload, signature] = raw.split(".")
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload, await getSecret()))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null
  }

  try {
    const { uid, exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { uid: string; exp: number }

    if (!uid || typeof exp !== "number" || exp < Date.now()) return null

    const users = await readCollection<StoredUser>("users")
    const user = users.find((u) => u.id === uid)
    return user ? toSessionUser(user) : null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Login throttling (per email + IP, in memory)                       */
/* ------------------------------------------------------------------ */

const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_FAILURES = 8
const WINDOW_MS = 15 * 60 * 1000

export function isLoginBlocked(key: string): boolean {
  const entry = attempts.get(key)
  if (!entry) return false
  if (entry.resetAt < Date.now()) {
    attempts.delete(key)
    return false
  }
  return entry.count >= MAX_FAILURES
}

export function recordLoginFailure(key: string) {
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < Date.now()) {
    attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

export function clearLoginFailures(key: string) {
  attempts.delete(key)
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
