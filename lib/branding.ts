/**
 * Branding options for a product, read from Amrod's
 * /api/v1/Products/GetProductsAndBranding response.
 *
 * Amrod's structure is Positions -> Methods -> Exclusions (colour codes a
 * method can't be used on), plus a branding guide PDF. The exact key names
 * haven't been confirmed against a live response yet, so the reader accepts
 * the usual spellings. Run `node scripts/amrod-branding-sample.mjs` to see
 * the real shape and adjust the key lists below if anything is missed.
 */

export interface BrandingMethod {
  code: string
  name: string
  maxColours: number | null
  /** e.g. "60 x 40 mm" when Amrod supplies a maximum print area. */
  maxSize: string | null
  /** Variant colour codes this method can't be used on. */
  excludedColours: string[]
}

export interface BrandingPosition {
  code: string
  name: string
  description: string
  required: boolean
  methods: BrandingMethod[]
}

export interface ProductBranding {
  positions: BrandingPosition[]
  guideUrl: string | null
}

/** One position the customer chose a branding type for. */
export interface BrandingChoice {
  positionCode: string
  positionName: string
  methodCode: string
  methodName: string
}

export const NO_BRANDING: ProductBranding = { positions: [], guideUrl: null }

/* ------------------------------------------------------------------ */
/*  Tolerant field access                                              */
/* ------------------------------------------------------------------ */

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v)

function pick(obj: Obj, keys: string[]): unknown {
  const lower = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]))
  for (const key of keys) {
    const real = lower.get(key.toLowerCase())
    if (real !== undefined && obj[real] !== null && obj[real] !== undefined && obj[real] !== "") {
      return obj[real]
    }
  }
  return undefined
}

const str = (v: unknown) =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : ""

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null
}

function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || (typeof v === "string" && v.toLowerCase() === "true")
}

const POSITION_LIST_KEYS = [
  "brandings", "branding", "brandingPositions", "positions", "brandingPosition",
]
const POSITION_CODE_KEYS = ["positionCode", "brandingPositionCode", "code", "position", "positionId", "id"]
const POSITION_NAME_KEYS = [
  "positionName", "brandingPositionName", "positionDescription", "name", "description", "position",
]
const POSITION_DESC_KEYS = ["comment", "comments", "positionComment", "note", "notes", "description"]
const REQUIRED_KEYS = ["required", "isRequired", "mandatory", "isMandatory"]

const METHOD_LIST_KEYS = ["methods", "brandingMethods", "brandings", "brandingTypes", "method"]
const METHOD_CODE_KEYS = ["brandingCode", "methodCode", "code", "brandingMethodCode", "id"]
const METHOD_NAME_KEYS = [
  "brandingName", "brandingDescription", "methodName", "brandingMethodName", "name", "description",
]
const MAX_COLOUR_KEYS = [
  "maxColours", "maxColors", "maximumColours", "maximumColors", "numberOfColours", "numberOfColors", "colours", "colors",
]
const WIDTH_KEYS = ["maxPrintingSizeWidth", "maxPrintWidth", "maxWidth", "printWidth", "width"]
const HEIGHT_KEYS = ["maxPrintingSizeHeight", "maxPrintHeight", "maxHeight", "printHeight", "height"]
const SIZE_TEXT_KEYS = ["maxPrintingSize", "maxPrintSize", "printSize", "printArea", "size"]
const EXCLUSION_KEYS = ["exclusions", "excludedColours", "excludedColors", "colourExclusions", "colorExclusions", "exclusion"]
const EXCLUSION_CODE_KEYS = ["colourCode", "colorCode", "codeColour", "code", "colour", "color"]

const GUIDE_KEYS = [
  "brandingGuide", "brandingGuideUrl", "brandingGuideline", "brandingGuidelines",
  "brandingGuidelineUrl", "brandingGuidePdf", "brandingTemplateUrl", "guideUrl",
]

function readMethod(raw: unknown): BrandingMethod | null {
  if (!isObj(raw)) return null
  const code = str(pick(raw, METHOD_CODE_KEYS))
  const name = str(pick(raw, METHOD_NAME_KEYS)) || code
  if (!code && !name) return null

  const width = num(pick(raw, WIDTH_KEYS))
  const height = num(pick(raw, HEIGHT_KEYS))
  const sizeText = str(pick(raw, SIZE_TEXT_KEYS))

  const excludedColours = arr(pick(raw, EXCLUSION_KEYS))
    .map((e) => (isObj(e) ? str(pick(e, EXCLUSION_CODE_KEYS)) : str(e)))
    .filter(Boolean)
    .map((c) => c.toUpperCase())

  return {
    code: code || name,
    name,
    maxColours: num(pick(raw, MAX_COLOUR_KEYS)),
    maxSize: width && height ? `${width} x ${height} mm` : sizeText || null,
    excludedColours,
  }
}

function readPosition(raw: unknown, index: number): BrandingPosition | null {
  if (!isObj(raw)) return null

  const methods = arr(pick(raw, METHOD_LIST_KEYS))
    .map(readMethod)
    .filter((m): m is BrandingMethod => m !== null)

  const code = str(pick(raw, POSITION_CODE_KEYS)) || `P${index + 1}`
  const name = str(pick(raw, POSITION_NAME_KEYS)) || code
  const description = str(pick(raw, POSITION_DESC_KEYS))

  return {
    code,
    name,
    description: description && description !== name ? description : "",
    required: bool(pick(raw, REQUIRED_KEYS)),
    methods: dedupe(methods, (m) => m.code),
  }
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * Reads a raw Amrod product. `templates` is the plain brandingTemplates list
 * from the normal Products endpoint, used when no detailed data exists.
 */
export function readProductBranding(
  product: Obj,
  templates: { position?: string; name?: string; url?: string }[] = [],
): ProductBranding {
  const positions = dedupe(
    arr(pick(product, POSITION_LIST_KEYS))
      .map(readPosition)
      .filter((p): p is BrandingPosition => p !== null),
    (p) => p.code,
  )

  // Products/ (without branding) only lists positions by name.
  const fallback: BrandingPosition[] =
    positions.length > 0
      ? []
      : templates
          .filter((t) => t?.name)
          .map((t, i) => ({
            code: str(t.position) || `P${i + 1}`,
            name: str(t.name),
            description: "",
            required: false,
            methods: [],
          }))

  // Some products mark required positions in a separate list.
  const requiredCodes = new Set(
    arr(pick(product, ["requiredBrandingPositions", "requiredPositions"]))
      .map((r) => (isObj(r) ? str(pick(r, POSITION_CODE_KEYS)) : str(r)))
      .filter(Boolean),
  )

  const guide =
    str(pick(product, GUIDE_KEYS)) ||
    templates.map((t) => str(t?.url)).find((u) => /^https?:\/\//.test(u)) ||
    ""

  return {
    positions: (positions.length > 0 ? positions : fallback).map((p) => ({
      ...p,
      required: p.required || requiredCodes.has(p.code),
    })),
    guideUrl: /^https?:\/\//.test(guide) ? guide : null,
  }
}

/** Methods available for a position on a given variant colour. */
export function methodsForColour(
  position: BrandingPosition,
  colourCode: string | null | undefined,
): BrandingMethod[] {
  const code = (colourCode ?? "").toUpperCase()
  if (!code) return position.methods
  return position.methods.filter((m) => !m.excludedColours.includes(code))
}

export function describeMethod(method: BrandingMethod): string {
  const extras = [
    method.maxColours ? `up to ${method.maxColours} colour${method.maxColours === 1 ? "" : "s"}` : "",
    method.maxSize ? `max ${method.maxSize}` : "",
  ].filter(Boolean)
  return extras.length ? `${method.name} (${extras.join(", ")})` : method.name
}

/** Short text for lists, e.g. "Left Chest: Embroidery; Back: Screen Print". */
export function summariseBranding(choices: BrandingChoice[] | undefined): string {
  if (!choices || choices.length === 0) return "Unbranded"
  return choices.map((c) => `${c.positionName}: ${c.methodName}`).join("; ")
}
