import {
  getAmrodProducts,
  getAmrodPrices,
  getAmrodStock,
} from "@/lib/amrod"

/* ------------------------------------------------------------------ */
/*  Raw Amrod shapes (only the fields we use)                          */
/* ------------------------------------------------------------------ */

interface AmrodCategory {
  id: number
  name: string
  path: string
  code: string
  image: string
}

interface AmrodImageUrl {
  url: string
  width: number
  height: number
}

interface AmrodImage {
  name: string
  isDefault: boolean
  urls: AmrodImageUrl[] | null
}

interface AmrodColourImages {
  name: string
  code: string
  images: AmrodImage[] | null
}

interface AmrodVariant {
  simpleCode: string
  fullCode: string
  codeColour: string | null
  codeColourName: string | null
  codeSize: string | null
  codeSizeName: string | null
}

interface AmrodBrandingTemplate {
  position: string
  name: string
  url: string
}

interface AmrodProduct {
  simpleCode: string
  fullCode: string
  productName: string
  description: string | null
  categories: AmrodCategory[] | null
  images: AmrodImage[] | null
  colourImages?: AmrodColourImages[] | null
  variants: AmrodVariant[] | null
  minimum: number
  introduced: string
  promotion: string
  brandingTemplates: AmrodBrandingTemplate[] | null
  gender?: string | null
  material?: string | null
  fit?: string | null
  keywords?: string | null
  brand?: { name: string; code: string; brandWebsiteLogo?: string } | null
  matchingCodes?:
    | { simpleCode: string; fullCode: string; genderValue: string }[]
    | null
}

interface AmrodPrice {
  simplecode: string
  fullCode: string
  price: number
}

interface AmrodStock {
  simpleCode: string
  fullCode: string
  stockType: number
  colourCode: string | null
  stock: number
  reservedStock: number
  incomingStock: number | null
}

/* ------------------------------------------------------------------ */
/*  Lenor shapes                                                       */
/* ------------------------------------------------------------------ */

export interface CatalogueVariant {
  fullCode: string
  color: string
  size: string
  price: number
  stock: number
  incoming: number
}

export interface CatalogueProduct {
  id: string
  sku: string
  name: string
  description: string
  /** Top-level category slug, e.g. "corporate-clothing". */
  category: string
  categoryName: string
  /** Every category path the product sits in, as slugs, e.g. "corporate-clothing/bodywarmers". */
  categoryPaths: string[]
  /** True when the product ONLY sits in the clearance tree. */
  isClearance: boolean
  brand: string | null
  brandLogo: string | null
  genders: string[]
  material: string | null
  fit: string | null
  onPromotion: boolean
  price: number
  images: string[]
  /** Images grouped by colour name (same strings used in `colors` / variants). */
  colorImages: Record<string, string[]>
  colors: string[]
  sizes: string[]
  sizeRange: string | null
  variants: CatalogueVariant[]
  stockLevel: "in-stock" | "low-stock" | "out-of-stock"
  stockOnHand: number
  incomingStock: number
  minOrderQty: number
  brandingPositions: { id: string; label: string; description: string }[]
  featured: boolean
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

export interface Facets {
  categories: FacetOption[]
  brands: FacetOption[]
  genders: FacetOption[]
  colours: FacetOption[]
  sizes: FacetOption[]
  materials: FacetOption[]
  fits: FacetOption[]
  priceRange: { min: number; max: number } | null
}

export interface CatalogueQuery {
  search?: string
  /** Slug or slug path, e.g. "corporate-clothing" or "corporate-clothing/bodywarmers". */
  category?: string
  brands?: string[]
  genders?: string[]
  colours?: string[]
  sizes?: string[]
  materials?: string[]
  fits?: string[]
  minPrice?: number
  maxPrice?: number
  minStock?: number
  stockOnly?: boolean
  promotionOnly?: boolean
  featured?: boolean
  sort?: "price-asc" | "price-desc" | "name-asc"
  page?: number
  perPage?: number
}

export interface CatalogueResult {
  products: CatalogueProduct[]
  total: number
  page: number
  totalPages: number
  facets: Facets
}

/* ------------------------------------------------------------------ */
/*  Cache state (kept on globalThis so Next dev reloads and separate   */
/*  route/page bundles all share one catalogue)                        */
/* ------------------------------------------------------------------ */

interface BaseProduct extends Omit<
  CatalogueProduct,
  | "price"
  | "variants"
  | "stockLevel"
  | "stockOnHand"
  | "incomingStock"
> {
  baseVariants: { fullCode: string; color: string; size: string }[]
  searchText: string
}

interface IndexedProduct {
  product: CatalogueProduct
  searchText: string
}

interface CatalogueState {
  items: IndexedProduct[]
  byId: Map<string, IndexedProduct>
  base: BaseProduct[]
  lastRawProducts: AmrodProduct[] | null
  builtAt: number
  refreshing: Promise<void> | null
}

const g = globalThis as typeof globalThis & {
  __lenorCatalogue?: CatalogueState
}

const state: CatalogueState = (g.__lenorCatalogue ??= {
  items: [],
  byId: new Map(),
  base: [],
  lastRawProducts: null,
  builtAt: 0,
  refreshing: null,
})

/** After this age the catalogue is served as-is while a refresh runs in the background. */
const LIVE_TTL_MS = 60_000
/** If a background refresh fails, wait this long before trying again. */
const RETRY_AFTER_FAILURE_MS = 15_000

const CLEARANCE_ROOT = "all-clearance-items"

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim()
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const SMALL_WORDS = new Set(["and", "of", "the", "for", "in", "to"])

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function humanizeFit(fit: string): string {
  return fit.replace(/([a-z])([A-Z])/g, "$1 $2")
}

function pickImageUrl(image: AmrodImage): string | null {
  const urls = (image.urls ?? []).filter((u) => Boolean(u?.url))
  if (urls.length === 0) return null
  return [...urls].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url
}

function imageUrls(images: AmrodImage[] | null | undefined): string[] {
  return [...(images ?? [])]
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map(pickImageUrl)
    .filter((url): url is string => Boolean(url))
}

function getStockLevel(stock: number) {
  if (stock <= 0) return "out-of-stock" as const
  if (stock <= 10) return "low-stock" as const
  return "in-stock" as const
}

const SIZE_ORDER = [
  "XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL",
  "4XL", "5XL", "6XL", "7XL",
]

function sizeRank(size: string): number {
  const index = SIZE_ORDER.indexOf(size.toUpperCase())
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < attempts - 1) {
        console.warn(
          `Lenor: Amrod load failed (attempt ${i + 1}/${attempts}), retrying`
        )
        await sleep(500 * (i + 1))
      }
    }
  }

  throw lastError
}

/* ------------------------------------------------------------------ */
/*  Building the catalogue                                             */
/* ------------------------------------------------------------------ */

/** Everything that only changes when Amrod's product list changes. */
function buildBase(raw: AmrodProduct[]): BaseProduct[] {
  const result: BaseProduct[] = []

  for (const product of raw) {
    const validVariants = (product.variants ?? []).filter((v) =>
      Boolean(v.fullCode)
    )

    // Without a variant there is nothing to price or stock.
    if (validVariants.length === 0) continue

    const baseVariants = validVariants.map((v) => ({
      fullCode: v.fullCode,
      color: v.codeColourName ?? "Standard",
      size: v.codeSizeName ?? "One Size",
    }))

    const colors = [
      ...new Set(
        validVariants
          .map((v) => v.codeColourName)
          .filter((v): v is string => Boolean(v))
      ),
    ]

    const sizes = [
      ...new Set(
        validVariants
          .map((v) => v.codeSizeName)
          .filter((v): v is string => Boolean(v))
      ),
    ]

    // Colour code -> colour name used on the variants, so images line up.
    const colourNameByCode = new Map<string, string>()
    for (const v of validVariants) {
      if (v.codeColour && v.codeColourName) {
        colourNameByCode.set(v.codeColour, v.codeColourName)
      }
    }

    const colorImages: Record<string, string[]> = {}
    for (const group of product.colourImages ?? []) {
      const urls = imageUrls(group.images)
      if (urls.length === 0) continue
      const name = colourNameByCode.get(group.code) ?? group.name
      colorImages[name] = [...new Set([...(colorImages[name] ?? []), ...urls])]
    }

    const images = [
      ...new Set(
        Object.keys(colorImages).length > 0
          ? Object.values(colorImages).flat()
          : imageUrls(product.images)
      ),
    ]

    const categoryPaths = [
      ...new Set(
        (product.categories ?? [])
          .map((c) =>
            (c.path ?? "")
              .split("/")
              .map(slugify)
              .filter(Boolean)
              .join("/")
          )
          .filter(Boolean)
      ),
    ]

    const isClearance =
      categoryPaths.length > 0 &&
      categoryPaths.every(
        (p) => p === CLEARANCE_ROOT || p.startsWith(`${CLEARANCE_ROOT}/`)
      )

    const primaryPath =
      categoryPaths.find((p) => !p.startsWith(CLEARANCE_ROOT)) ??
      categoryPaths[0]
    const category = primaryPath ? primaryPath.split("/")[0] : "uncategorised"

    const genders = [
      ...new Set(
        [
          product.gender,
          ...(product.matchingCodes ?? []).map((m) => m.genderValue),
        ].filter((v): v is string => Boolean(v && v.trim()))
      ),
    ]

    const name = product.productName
    const brand = product.brand?.name ?? null

    const searchText = [
      name,
      product.simpleCode,
      product.fullCode,
      brand,
      product.keywords,
      ...(product.categories ?? []).map((c) => c.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    const minimum = Number(product.minimum)

    result.push({
      id: product.simpleCode,
      sku: validVariants[0].fullCode,
      name,
      description: stripHtml(product.description ?? ""),
      category,
      categoryName: titleFromSlug(category),
      categoryPaths,
      isClearance,
      brand,
      brandLogo: product.brand?.brandWebsiteLogo ?? null,
      genders,
      material: product.material?.trim() || null,
      fit: product.fit?.trim() ? humanizeFit(product.fit.trim()) : null,
      onPromotion: product.promotion === "1",
      images,
      colorImages,
      colors: colors.length > 0 ? colors : ["Standard"],
      sizes: sizes.length > 0 ? sizes : ["One Size"],
      sizeRange:
        sizes.length > 1 ? `${sizes[0]} - ${sizes[sizes.length - 1]}` : null,
      minOrderQty: Number.isFinite(minimum) && minimum > 0 ? minimum : 1,
      brandingPositions: (product.brandingTemplates ?? []).map(
        (template, index) => ({
          id: `bp-${product.simpleCode}-${index}`,
          label: template.name,
          description: `Branding template position ${template.position}`,
        })
      ),
      featured: product.promotion === "1",
      baseVariants,
      searchText,
    })
  }

  return result
}

/** Adds the parts that change often: price and stock. */
function enrich(
  base: BaseProduct,
  priceMap: Map<string, number>,
  stockMap: Map<string, { stock: number; incoming: number }>
): IndexedProduct {
  const { baseVariants, searchText, ...rest } = base

  const variants: CatalogueVariant[] = baseVariants.map((v) => {
    const s = stockMap.get(v.fullCode)
    return {
      ...v,
      price: priceMap.get(v.fullCode) ?? 0,
      stock: s?.stock ?? 0,
      incoming: s?.incoming ?? 0,
    }
  })

  let price = 0
  let stockOnHand = 0
  let incomingStock = 0

  for (const v of variants) {
    if (v.price > 0 && (price === 0 || v.price < price)) price = v.price
    stockOnHand += v.stock
    incomingStock += v.incoming
  }

  return {
    searchText,
    product: {
      ...rest,
      price,
      variants,
      stockOnHand,
      incomingStock,
      stockLevel: getStockLevel(stockOnHand),
    },
  }
}

async function loadCatalogue(): Promise<void> {
  const started = performance.now()

  const [rawProducts, prices, stock] = await Promise.all([
    getAmrodProducts<AmrodProduct[]>(),
    getAmrodPrices<AmrodPrice[]>(),
    getAmrodStock<AmrodStock[]>(),
  ])

  // The raw product list is cached by lib/amrod.ts. Only redo the heavy
  // normalisation when Amrod's list actually changed.
  if (rawProducts !== state.lastRawProducts) {
    state.base = buildBase(rawProducts ?? [])
    state.lastRawProducts = rawProducts
  }

  const priceMap = new Map<string, number>()
  for (const item of prices ?? []) {
    priceMap.set(item.fullCode, item.price)
  }

  const stockMap = new Map<string, { stock: number; incoming: number }>()
  for (const item of stock ?? []) {
    const existing = stockMap.get(item.fullCode) ?? { stock: 0, incoming: 0 }
    existing.stock += item.stock ?? 0
    existing.incoming += item.incomingStock ?? 0
    stockMap.set(item.fullCode, existing)
  }

  const items = state.base.map((b) => enrich(b, priceMap, stockMap))
  const byId = new Map(items.map((item) => [item.product.id, item]))

  state.items = items
  state.byId = byId
  state.builtAt = Date.now()

  console.log(
    `Lenor: catalogue rebuilt (${items.length} products) in ${(
      performance.now() - started
    ).toFixed(0)} ms`
  )
}

function refreshCatalogue(): Promise<void> {
  if (state.refreshing) return state.refreshing

  state.refreshing = (async () => {
    try {
      await withRetry(loadCatalogue)
    } finally {
      state.refreshing = null
    }
  })()

  return state.refreshing
}

/**
 * Returns the normalised catalogue. The first call waits for Amrod.
 * After that it always answers instantly from memory; when the data is older
 * than LIVE_TTL_MS a refresh runs in the background.
 */
async function getCatalogue(): Promise<IndexedProduct[]> {
  if (state.items.length === 0) {
    await refreshCatalogue()
    return state.items
  }

  if (Date.now() - state.builtAt > LIVE_TTL_MS) {
    refreshCatalogue().catch((error) => {
      console.error("Lenor: background catalogue refresh failed:", error)
      state.builtAt = Date.now() - LIVE_TTL_MS + RETRY_AFTER_FAILURE_MS
    })
  }

  return state.items
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function getAllProducts(): Promise<CatalogueProduct[]> {
  return (await getCatalogue()).map((i) => i.product)
}

export async function getProductById(
  id: string
): Promise<CatalogueProduct | null> {
  await getCatalogue()
  return state.byId.get(id)?.product ?? null
}

type FacetKey = "brand" | "gender" | "colour" | "size" | "material" | "fit" | "price"

function lowerSet(values?: string[]): Set<string> | null {
  const cleaned = (values ?? []).map((v) => v.trim().toLowerCase()).filter(Boolean)
  return cleaned.length > 0 ? new Set(cleaned) : null
}

function inCategory(paths: string[], category: string): boolean {
  return paths.some((p) => p === category || p.startsWith(`${category}/`))
}

function applyFilters(
  items: IndexedProduct[],
  q: CatalogueQuery,
  skip?: FacetKey
): IndexedProduct[] {
  const terms = (q.search ?? "").toLowerCase().split(/\s+/).filter(Boolean)
  const category = q.category?.trim().toLowerCase() || undefined
  const includeClearance = Boolean(category?.startsWith(CLEARANCE_ROOT))

  const brands = skip === "brand" ? null : lowerSet(q.brands)
  const genders = skip === "gender" ? null : lowerSet(q.genders)
  const colours = skip === "colour" ? null : lowerSet(q.colours)
  const sizes = skip === "size" ? null : lowerSet(q.sizes)
  const materials = skip === "material" ? null : lowerSet(q.materials)
  const fits = skip === "fit" ? null : lowerSet(q.fits)

  return items.filter(({ product: p, searchText }) => {
    // Amrod keeps clearance out of normal browsing and search.
    if (!includeClearance && p.isClearance) return false
    if (terms.length > 0 && !terms.every((t) => searchText.includes(t))) return false
    if (category && !inCategory(p.categoryPaths, category)) return false

    if (brands && !(p.brand && brands.has(p.brand.toLowerCase()))) return false
    if (genders && !p.genders.some((v) => genders.has(v.toLowerCase()))) return false
    if (colours && !p.colors.some((v) => colours.has(v.toLowerCase()))) return false
    if (sizes && !p.sizes.some((v) => sizes.has(v.toLowerCase()))) return false
    if (materials && !(p.material && materials.has(p.material.toLowerCase()))) return false
    if (fits && !(p.fit && fits.has(p.fit.toLowerCase()))) return false

    if (skip !== "price") {
      if (q.minPrice !== undefined && p.price < q.minPrice) return false
      if (q.maxPrice !== undefined && p.price > q.maxPrice) return false
    }

    if (q.minStock !== undefined && p.stockOnHand < q.minStock) return false
    if (q.stockOnly && p.stockLevel === "out-of-stock") return false
    if (q.promotionOnly && !p.onPromotion) return false
    if (q.featured && !p.featured) return false

    return true
  })
}

function countFacet(
  items: IndexedProduct[],
  pick: (p: CatalogueProduct) => (string | null | undefined)[],
  label: (value: string) => string = (v) => v
): FacetOption[] {
  const counts = new Map<string, number>()

  for (const { product } of items) {
    for (const value of new Set(pick(product))) {
      if (!value) continue
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }

  return [...counts]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function categoryFacet(
  items: IndexedProduct[],
  category: string | undefined
): FacetOption[] {
  const depth = category ? category.split("/").length : 0
  const includeClearance = Boolean(category?.startsWith(CLEARANCE_ROOT))
  const counts = new Map<string, number>()

  for (const { product } of items) {
    const seen = new Set<string>()

    for (const path of product.categoryPaths) {
      if (category && !(path === category || path.startsWith(`${category}/`))) continue
      if (!includeClearance && path.startsWith(CLEARANCE_ROOT)) continue

      const parts = path.split("/")
      if (parts.length <= depth) continue
      seen.add(parts.slice(0, depth + 1).join("/"))
    }

    for (const key of seen) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts]
    .map(([value, count]) => ({
      value,
      label: titleFromSlug(value.split("/").pop() ?? value),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function byPrice(direction: "asc" | "desc") {
  return (a: IndexedProduct, b: IndexedProduct) => {
    const ap = a.product.price
    const bp = b.product.price
    if (ap === bp) return 0
    // Products without a price always go last.
    if (ap <= 0) return 1
    if (bp <= 0) return -1
    return direction === "asc" ? ap - bp : bp - ap
  }
}

export async function queryCatalogue(
  q: CatalogueQuery
): Promise<CatalogueResult> {
  const items = await getCatalogue()
  const category = q.category?.trim().toLowerCase() || undefined

  const filtered = applyFilters(items, q)

  const sorted =
    q.sort === "price-asc"
      ? [...filtered].sort(byPrice("asc"))
      : q.sort === "price-desc"
        ? [...filtered].sort(byPrice("desc"))
        : q.sort === "name-asc"
          ? [...filtered].sort((a, b) => a.product.name.localeCompare(b.product.name))
          : filtered

  const requestedPage = Number(q.page ?? 1)
  const requestedPerPage = Number(q.perPage ?? 12)

  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1
  const perPage = Number.isFinite(requestedPerPage)
    ? Math.min(100, Math.max(1, Math.floor(requestedPerPage)))
    : 12

  const total = sorted.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage

  // Each facet is counted with every filter EXCEPT its own, so choosing a
  // brand doesn't make the other brands disappear.
  const priced = applyFilters(items, q, "price").filter((i) => i.product.price > 0)
  const prices = priced.map((i) => i.product.price)

  const facets: Facets = {
    categories: categoryFacet(filtered, category),
    brands: countFacet(applyFilters(items, q, "brand"), (p) => [p.brand]),
    genders: countFacet(applyFilters(items, q, "gender"), (p) => p.genders),
    colours: countFacet(applyFilters(items, q, "colour"), (p) => p.colors, titleCase),
    sizes: countFacet(applyFilters(items, q, "size"), (p) => p.sizes).sort(
      (a, b) => sizeRank(a.value) - sizeRank(b.value) || a.label.localeCompare(b.label)
    ),
    materials: countFacet(applyFilters(items, q, "material"), (p) => [p.material]),
    fits: countFacet(applyFilters(items, q, "fit"), (p) => [p.fit]),
    priceRange:
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null,
  }

  return {
    products: sorted.slice(start, start + perPage).map((i) => i.product),
    total,
    page,
    totalPages,
    facets,
  }
}