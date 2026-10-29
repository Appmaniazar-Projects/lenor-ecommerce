// Prints the real shape of Amrod's branding data for one product, so the
// field names in lib/branding.ts can be checked.
//
//   node scripts/amrod-branding-sample.mjs            (first product with branding)
//   node scripts/amrod-branding-sample.mjs AMT-100    (a specific simple code)
//   node scripts/amrod-branding-sample.mjs --summary  (formats used across ALL products)
//
// Reads AMROD_* values from .env.local. Prints no passwords or tokens.
import { readFileSync, writeFileSync } from "node:fs"

const env = { ...process.env }
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {}
}

const loginUrl = env.AMROD_LOGIN_URL || "https://identity.amrod.co.za/VendorLogin"
const apiUrl = (env.AMROD_API_URL || "https://vendorapi.amrod.co.za").replace(/\/$/, "")

const login = await fetch(loginUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({
    UserName: env.AMROD_USERNAME,
    Password: env.AMROD_PASSWORD,
    CustomerCode: env.AMROD_CUSTOMER_CODE,
  }),
})
if (!login.ok) throw new Error(`Login failed: ${login.status} ${await login.text()}`)
const loginJson = await login.json()
const token = loginJson.token ?? loginJson.Token ?? loginJson.accessToken ?? loginJson.access_token

console.log("Downloading GetProductsAndBranding (this can take a minute)...")
const res = await fetch(`${apiUrl}/api/v1/Products/GetProductsAndBranding`, {
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
})
console.log("HTTP", res.status)
if (res.status === 204) throw new Error("Amrod returned 204 (maintenance window 00:00-01:00?)")
const products = await res.json()
console.log("Products:", products.length)

if (process.argv[2] === "--summary") {
  const kind = (v) => (v === null || v === undefined ? "null" : Array.isArray(v) ? (v.length ? `array of ${typeof v[0]}` : "empty array") : typeof v)
  const tally = {}
  const add = (field, value) => {
    tally[field] ??= {}
    tally[field][value] = (tally[field][value] ?? 0) + 1
  }
  for (const p of products) {
    add("behaviour", String(p.behaviour))
    add("requiredBrandingPositions", kind(p.requiredBrandingPositions))
    add("noCoBrandingPositions", kind(p.noCoBrandingPositions))
    add("fullBrandingGuide", p.fullBrandingGuide ? "set" : "missing")
    add("brandings", kind(p.brandings))
    for (const pos of p.brandings ?? []) {
      add("positionMultiplier", String(pos.positionMultiplier))
      add("position keys", Object.keys(pos).sort().join(","))
      for (const m of pos.method ?? []) {
        add("method keys", Object.keys(m).sort().join(","))
        add("exclusions", kind(m.exclusions))
        add("numberOfColours", String(m.numberOfColours))
      }
    }
  }
  for (const [field, counts] of Object.entries(tally)) {
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
    console.log(`\n${field}:`)
    for (const [value, count] of top) console.log(`  ${count}\t${value}`)
  }
  const ex = products.flatMap((p) => (p.brandings ?? []).flatMap((pos) => (pos.method ?? []).map((m) => m.exclusions))).find((e) => e && e.length)
  console.log("\nExample non-empty exclusions:", JSON.stringify(ex))
  process.exit(0)
}

const wanted = process.argv[2]
const isBrandingKey = (k) => /brand|position|method|guide/i.test(k)
const product =
  products.find((p) => p.simpleCode === wanted) ??
  products.find((p) => Object.entries(p).some(([k, v]) => isBrandingKey(k) && Array.isArray(v) && v.length > 0)) ??
  products[0]

console.log("\nProduct:", product.simpleCode, "-", product.productName)
console.log("\nAll top-level keys:\n ", Object.keys(product).join(", "))

const brandingParts = Object.fromEntries(Object.entries(product).filter(([k]) => isBrandingKey(k)))
const text = JSON.stringify(brandingParts, null, 2)
console.log("\nBranding-related fields:\n" + (text.length > 6000 ? text.slice(0, 6000) + "\n... (cut, see file)" : text))

writeFileSync("amrod-branding-sample.json", JSON.stringify(product, null, 2))
console.log("\nFull product saved to amrod-branding-sample.json (not committed, delete when done).")
