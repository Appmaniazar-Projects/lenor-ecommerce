import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"
import { readCollection } from "@/lib/demo-store"

export const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads")
export const MAX_LOGO_BYTES = 20 * 1024 * 1024

export interface StoredUpload {
  id: string
  fileName: string
  extension: string
  contentType: string
  size: number
  /** Vector files work for every branding method; raster ones don't. */
  kind: "vector" | "raster"
  uploadedAt: string
  userId: string | null
}

interface FileRule {
  contentType: string
  kind: "vector" | "raster"
  matches: (bytes: Buffer) => boolean
}

const startsWith = (bytes: Buffer, ...signature: number[]) =>
  signature.every((byte, i) => bytes[i] === byte)

const startsWithText = (bytes: Buffer, text: string) =>
  bytes.subarray(0, text.length).toString("latin1") === text

const isPdf = (b: Buffer) => startsWithText(b, "%PDF-")
const isPostScript = (b: Buffer) =>
  startsWithText(b, "%!PS-Adobe") || startsWith(b, 0xc5, 0xd0, 0xd3, 0xc6)

function isSvg(bytes: Buffer): boolean {
  const head = bytes
    .subarray(0, 4096)
    .toString("utf8")
    .replace(/^﻿/, "")
    .trimStart()
    .toLowerCase()
  return (
    (head.startsWith("<?xml") || head.startsWith("<svg") || head.startsWith("<!--")) &&
    head.includes("<svg")
  )
}

/**
 * Allowed logo files, checked by extension AND by the file's first bytes,
 * since the type a browser reports can't be trusted.
 */
export const LOGO_RULES: Record<string, FileRule> = {
  ".ai": {
    contentType: "application/postscript",
    kind: "vector",
    matches: (b) => isPdf(b) || isPostScript(b),
  },
  ".eps": { contentType: "application/postscript", kind: "vector", matches: isPostScript },
  ".pdf": { contentType: "application/pdf", kind: "vector", matches: isPdf },
  ".svg": { contentType: "image/svg+xml", kind: "vector", matches: isSvg },
  ".png": {
    contentType: "image/png",
    kind: "raster",
    matches: (b) => startsWith(b, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  },
  ".jpg": { contentType: "image/jpeg", kind: "raster", matches: (b) => startsWith(b, 0xff, 0xd8, 0xff) },
  ".jpeg": { contentType: "image/jpeg", kind: "raster", matches: (b) => startsWith(b, 0xff, 0xd8, 0xff) },
  ".webp": {
    contentType: "image/webp",
    kind: "raster",
    matches: (b) => startsWithText(b, "RIFF") && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  ".tif": {
    contentType: "image/tiff",
    kind: "raster",
    matches: (b) => startsWith(b, 0x49, 0x49, 0x2a, 0x00) || startsWith(b, 0x4d, 0x4d, 0x00, 0x2a),
  },
  ".tiff": {
    contentType: "image/tiff",
    kind: "raster",
    matches: (b) => startsWith(b, 0x49, 0x49, 0x2a, 0x00) || startsWith(b, 0x4d, 0x4d, 0x00, 0x2a),
  },
}

export const ACCEPTED_LOGO_EXTENSIONS = Object.keys(LOGO_RULES)

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function findUpload(id: string): Promise<StoredUpload | null> {
  if (!ID_PATTERN.test(id)) return null
  const uploads = await readCollection<StoredUpload>("uploads")
  return uploads.find((upload) => upload.id === id) ?? null
}

export async function readUploadFile(upload: StoredUpload): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, `${upload.id}${upload.extension}`))
}
