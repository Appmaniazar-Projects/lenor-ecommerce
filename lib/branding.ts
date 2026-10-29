/**
 * Branding options for a product, read from Amrod's
 * /api/v1/Products/GetProductsAndBranding response.
 *
 * Real shape (checked against a live response, Oct 2026):
 *   fullBrandingGuide: "https://...pdf"
 *   brandings: [{ positionCode, positionName, positionComment, positionMultiplier,
 *     method: [{ brandingCode, brandingName, displayIndex, numberOfColours,
 *                maxPrintingSizeWidth, maxPrintingSizeHeight, exclusions }] }]
 *   requiredBrandingPositions: ["A", "B"]   (docs: may be a comma list)
 *   noCoBrandingPositions: null | [...]     (fixed Amrod branding)
 * Exclusions are colour codes; the docs describe them as a comma list.
 * Other spellings are still accepted as a fallback.
 */

export interface BrandingMethod {
  code: string
  name: string
  maxColours: number | null
  /** Amrod's wording, e.g. "Full Colour" or "4". */
  coloursLabel: string | null
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
  /** How many places this position can be branded (A-1, A-2...). */
  multiplier: number
  methods: BrandingMethod[]
}

export interface ProductBranding {
  /** Positions the customer can choose branding for. */
  positions: BrandingPosition[]
  /** Positions Amrod brands with a fixed design (no customer artwork). */
  fixedPositions: string[]
  guideUrl: string | null
}

/** One position the customer chose a branding type for. */
export interface BrandingChoice {
  positionCode: string
  positionName: string
  methodCode: string
  methodName: string
}

export const NO_BRANDING: ProductBranding = {
  positions: [],
  fixedPositions: [],
  guideUrl: null,
}

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

/** Arrays, or comma/semicolon separated text, as a list of codes. */
function codeList(v: unknown, keys: string[] = []): string[] {
  const items = Array.isArray(v)
    ? v
    : typeof v === "string"
      ? v.split(/[,;]/)
      : []
  return items
    .map((e) => (isObj(e) ? str(pick(e, keys)) : str(e)))
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
}

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
const POSITION_DESC_KEYS = ["positionComment", "comment", "comments", "note", "notes", "description"]
const POSITION_MULTIPLIER_KEYS = ["positionMultiplier", "multiplier"]
const REQUIRED_KEYS = ["required", "isRequired", "mandatory", "isMandatory"]

const METHOD_LIST_KEYS = ["methods", "brandingMethods", "brandings", "brandingTypes", "method"]
const METHOD_CODE_KEYS = ["brandingCode", "methodCode", "code", "brandingMethodCode", "id"]
const METHOD_NAME_KEYS = [
  "brandingName", "brandingDescription", "methodName", "brandingMethodName", "name", "description",
]
const MAX_COLOUR_KEYS = [
  "numberOfColours", "numberOfColors", "maxColours", "maxColors", "maximumColours", "maximumColors", "colours", "colors",
]
const WIDTH_KEYS = ["maxPrintingSizeWidth", "maxPrintWidth", "maxWidth", "printWidth", "width"]
const HEIGHT_KEYS = ["maxPrintingSizeHeight", "maxPrintHeight", "maxHeight", "printHeight", "height"]
const SIZE_TEXT_KEYS = ["maxPrintingSize", "maxPrintSize", "printSize", "printArea", "size"]
const EXCLUSION_KEYS = ["exclusions", "excludedColours", "excludedColors", "colourExclusions", "colorExclusions", "exclusion"]
const EXCLUSION_CODE_KEYS = ["colourCode", "colorCode", "codeColour", "code", "colour", "color"]

const GUIDE_KEYS = [
  "fullBrandingGuide", "brandingGuide", "brandingGuideUrl", "brandingGuideline", "brandingGuidelines",
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

  const excludedColours = codeList(pick(raw, EXCLUSION_KEYS), EXCLUSION_CODE_KEYS)
  const colours = pick(raw, MAX_COLOUR_KEYS)
  const coloursText = str(colours)

  return {
    code: code || name,
    name,
    maxColours: num(colours),
    coloursLabel: coloursText || null,
    maxSize: width && height ? `${width} x ${height} mm` : sizeText || null,
    excludedColours,
  }
}

function readPosition(raw: unknown, index: number): BrandingPosition | null {
  if (!isObj(raw)) return null

  const methods = arr(pick(raw, METHOD_LIST_KEYS))
    .map((m) => ({ method: readMethod(m), order: isObj(m) ? num(pick(m, ["displayIndex"])) : null }))
    .filter((m): m is { method: BrandingMethod; order: number | null } => m.method !== null)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((m) => m.method)

  const code = str(pick(raw, POSITION_CODE_KEYS)) || `P${index + 1}`
  const name = str(pick(raw, POSITION_NAME_KEYS)) || code
  const description = str(pick(raw, POSITION_DESC_KEYS))

  return {
    code,
    name,
    description: description && description !== name ? description : "",
    required: bool(pick(raw, REQUIRED_KEYS)),
    multiplier: Math.max(1, Math.floor(num(pick(raw, POSITION_MULTIPLIER_KEYS)) ?? 1)),
    methods: dedupe(methods, (m) => m.code),
  }
}

/** Amrod URLs contain spaces ("Pdf Templates/..."); encode them once. */
function safeUrl(url: string): string {
  try {
    return encodeURI(decodeURI(url))
  } catch {
    return encodeURI(url)
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
            multiplier: 1,
            methods: [],
          }))

  // Required and fixed (no co-branding) positions are separate code lists.
  const requiredCodes = new Set(
    codeList(pick(product, ["requiredBrandingPositions", "requiredPositions"]), POSITION_CODE_KEYS),
  )
  const fixedCodes = new Set(
    codeList(pick(product, ["noCoBrandingPositions", "noCoBranding"]), POSITION_CODE_KEYS),
  )
  const all = positions.length > 0 ? positions : fallback

  const guide =
    str(pick(product, GUIDE_KEYS)) ||
    templates.map((t) => str(t?.url)).find((u) => /^https?:\/\//.test(u)) ||
    ""

  return {
    positions: all
      .filter((p) => !fixedCodes.has(p.code.toUpperCase()))
      .map((p) => ({
        ...p,
        required: p.required || requiredCodes.has(p.code.toUpperCase()),
      })),
    fixedPositions: all
      .filter((p) => fixedCodes.has(p.code.toUpperCase()))
      .map((p) => p.name),
    guideUrl: /^https?:\/\//.test(guide) ? safeUrl(guide) : null,
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
  const colours = method.maxColours
    ? `up to ${method.maxColours} colour${method.maxColours === 1 ? "" : "s"}`
    : method.coloursLabel
      ? method.coloursLabel.toLowerCase()
      : ""
  const extras = [
    colours,
    method.maxSize ? `max ${method.maxSize}` : "",
  ].filter(Boolean)
  return extras.length ? `${method.name} (${extras.join(", ")})` : method.name
}

/** Short text for lists, e.g. "Left Chest: Embroidery; Back: Screen Print". */
export function summariseBranding(choices: BrandingChoice[] | undefined): string {
  if (!choices || choices.length === 0) return "Unbranded"
  return choices.map((c) => `${c.positionName}: ${c.methodName}`).join("; ")
}
