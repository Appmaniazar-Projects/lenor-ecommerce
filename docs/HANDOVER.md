# Lenor Website Handover Guide

Last updated 30 October 2026

Lenor is a South African B2B shop for branded promotional products, built on Amrod's catalogue. Customers browse Amrod products, request branded quotes with their logo, or order unbranded stock. This guide is for whoever takes over the code at github.com/Appmaniazar-Projects/lenor-ecommerce.

## Accounts and access

Everything runs under Appmaniazar's accounts. No passwords or keys are written in this guide or in the code: ask the Appmaniazar team for access.

| Service | What it holds | Where and how to sign in |
| --- | --- | --- |
| GitHub | The code | [Appmaniazar-Projects/lenor-ecommerce](https://github.com/Appmaniazar-Projects/lenor-ecommerce), branch `main` |
| Vercel | Optional hosting (not in use; the live site runs on the VPS) | Appmaniazar Vercel account, project `lenor-ecommerce` |
| Supabase | Only needed if the site is hosted on Vercel; the VPS stores data in /root/lenor/.data/ | Sign in to Supabase with the Appmaniazar GitHub account ("Continue with GitHub"), which itself signs in with Google |
| Amrod Vendor API | Product catalogue, prices, stock, branding data | Username, password and customer code issued by Amrod; help: api.support@amrod.co.za |
| Amrod Order Entry API | Sending orders straight to Amrod | Not granted yet; must be requested from Amrod |
| PayFast | Card payments (not switched on) | Merchant ID and key exist; passphrase still needed from Lenor |
| Email (noreply@lenor.co.za) | Quote and order alerts | SMTP login still needed from whoever hosts Lenor's email |
| domains.co.za | The VPS (billing, password, backups). The lenor.co.za DNS is run elsewhere and already points at the VPS | Lenor's domains.co.za customer portal; access via Lenor (Mr Tk) |
| VPS (server.lenor.co.za) | The live website, https://lenor.co.za (since 30 October 2026) | ssh root@41.222.36.83 (password in the domains.co.za portal); SSL contact support@appmaniazar.co.za. Full details in [docs/DEPLOYMENT-RECORD.md](DEPLOYMENT-RECORD.md) |

Secrets live only in `/root/lenor/.env.production.local` on the server (or Vercel's environment variables if Vercel is used) and, for local work, in a `.env.local` file that is never committed.

## How it fits together

```
Browser ──HTTPS──▶ Nginx (lenor.co.za, Let's Encrypt SSL)
                     │
                     ▼
              Next.js app (PM2 process "lenor", port 3000)
               │                 │                 │
               ▼                 ▼                 ▼
     /root/lenor/.data/   Amrod Vendor API    SMTP email
     (accounts, quotes,   (catalogue, prices, (noreply@lenor.co.za)
      orders, logos)       stock, branding)

Everything in the middle runs on the Lenor VPS; only Amrod and email are outside it.
```

The browser never talks to Amrod or the stored data directly: everything goes through the app on the VPS. If the site is ever moved to Vercel, Supabase replaces the `.data/` folder and logos upload straight from the browser to Supabase Storage.

## Code map

Next.js 16 (App Router) with React 19, TypeScript, Tailwind CSS 4 and shadcn/ui components. All Amrod, database and email work happens on the server; the browser only talks to the site's own `/api` routes.

| Path | What it does |
| --- | --- |
| `lib/amrod.ts` | Amrod client: VendorLogin token (refreshed on 401), cached GET requests, treats 204 as "Amrod in maintenance" |
| `lib/catalogue.ts` | Turns Amrod products, prices and stock into the shop catalogue; search, filters, facets; snapshot and background refresh |
| `lib/branding.ts` | Reads Amrod branding positions, types, colour exclusions and the guide PDF |
| `lib/store/` | Storage layer: `supabase-store.ts` (Vercel) or `file-store.ts` (`.data/` folder, local and VPS); `index.ts` picks one |
| `lib/auth.ts` | Accounts: scrypt password hashes, signed HttpOnly session cookie, login throttling, admin check |
| `lib/uploads.ts` | Logo rules: allowed types, 20 MB limit, file-signature checks |
| `lib/notify.ts` | Email alerts for new quotes and orders (nodemailer, SMTP) |
| `lib/pricing-visibility.ts` | Optional rule to hide prices from visitors |
| `lib/records.ts` | Shapes of saved users, quotes and orders; who may see a record |
| `lib/api.ts` | Browser-side helpers that call the site's `/api` routes |
| `lib/constants.ts` | Site name, VAT (15%), categories, price formatting |
| `app/(shop)/` | Customer pages: products, product detail, quote basket, cart, checkout, orders |
| `app/api/` | Server routes: products, quotes, checkout, orders, logo upload, auth, cron |
| `components/products/branding-selector.tsx` | The Unbranded/Branded picker used on the product page and in the quote basket |
| `contexts/` | Browser state: cart, quote basket (both saved in localStorage), signed-in user |
| `supabase/schema.sql` | Database tables and storage buckets; run once in Supabase |
| `scripts/amrod-branding-sample.mjs` | Prints the real shape of Amrod's branding data (`--summary` checks all products) |
| `DEPLOY.md` | Step-by-step hosting guide (Vercel + Supabase, or VPS) |
| `vercel.json` | Daily cron that refreshes the catalogue (Vercel only; on the VPS the catalogue refreshes as visitors browse) |
| `lib/mock-data.ts` | Shared TypeScript types; its old mock products are no longer used by the shop |

`app/(admin)/admin` and `components/layout/admin-sidebar.tsx` are an unfinished admin layout with no pages behind it. Lenor admins currently use `/orders`, which shows them every order and quote.

## Run it locally

You need Node.js 20.9 or later and pnpm. Without Supabase settings, everything is saved in a `.data/` folder in the project, which is ignored by git.

1. `git clone https://github.com/Appmaniazar-Projects/lenor-ecommerce` and `cd lenor-ecommerce`
2. `pnpm install`
3. Copy `.env.example` to `.env.local` and fill in at least the four `AMROD_` values.
4. `pnpm dev`, then open http://localhost:3000. The first page load waits for Amrod's full catalogue (about 4,000 products); later loads are instant.
5. Before pushing, run `pnpm build`. Type errors fail the build on purpose.

Amrod's API returns nothing between 00:00 and 01:00 (South African time). Locally the site then serves its last saved catalogue, or shows an error if it has never loaded one.

## Settings

All settings are environment variables. `.env.example` lists them with comments. On the VPS they live in `/root/lenor/.env.production.local` (rebuild and `pm2 restart lenor` after changing them); on Vercel they live in the project's settings, and changes only apply after a redeploy.

| Variable | Required | What it does |
| --- | --- | --- |
| `AMROD_API_URL` | Yes | `https://vendorapi.amrod.co.za` |
| `AMROD_USERNAME`, `AMROD_PASSWORD`, `AMROD_CUSTOMER_CODE` | Yes | Amrod VendorLogin details |
| `NEXT_PUBLIC_APP_URL` | Yes | Public address of the site; must start with `https://` in production so login cookies are secure. Built into the site, so redeploy after changing it |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | On Vercel | Supabase project URL and service\_role key. Server only; never put the key in a `NEXT_PUBLIC_` variable |
| `SESSION_SECRET` | On Vercel | 32+ random characters that sign login cookies. Changing it signs everyone out |
| `CRON_SECRET` | On Vercel | Lets Vercel's daily cron call `/api/cron/catalogue` |
| `ADMIN_EMAILS` | Recommended | Comma-separated staff emails who see every order and quote |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | For email | Outgoing mail for noreply@lenor.co.za. Empty `SMTP_HOST` turns email off |
| `NOTIFY_EMAILS` | Optional | Staff who get alerts; defaults to `ADMIN_EMAILS` |
| `NEXT_PUBLIC_PRICES_REQUIRE_LOGIN` | Optional | `true` hides prices until customers sign in (default: prices shown) |
| `AMROD_LOGIN_URL` | Optional | Overrides the VendorLogin address (testing only) |
| `AMROD_USE_BRANDING_ENDPOINT` | Optional | `false` uses the plain product list without branding data |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX` | Not used yet | Kept for the PayFast integration still to be built |

## Deploying

The live site runs on Lenor's VPS at domains.co.za: https://lenor.co.za, live since 30 October 2026. The **Lenor Server Deployment Record** ([docs/DEPLOYMENT-RECORD.md](DEPLOYMENT-RECORD.md)) has the full server details: what was installed, where every file is, how SSL renews and what to do when something breaks. `DEPLOY.md` in the repo has the setup steps.

**The VPS (current)**

- Ubuntu 24.04 at `41.222.36.83`; log in with `ssh root@41.222.36.83`.
- The site runs from `/root/lenor` under PM2 (process `lenor`, port 3000), behind Nginx with a free Let's Encrypt certificate (contact: support@appmaniazar.co.za).
- Data is stored in `/root/lenor/.data/`; Supabase is not used.
- To put new code live after pushing to `main`:

```bash
cd ~/lenor && git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart lenor
```

**Vercel + Supabase (optional, not in use)**

The code can also run on Vercel with Supabase for storage, for example as a test site. Run `supabase/schema.sql` in a Supabase project, set the environment variables in Vercel and redeploy. On Vercel, logos upload straight from the browser to Supabase Storage, and a daily cron (`vercel.json`) refreshes the catalogue. Free Supabase projects pause after a week with no visits.

## Working with Amrod

The site uses Amrod's Vendor API, which is read-only: it supplies the catalogue but cannot place orders. Placing orders needs Amrod's separate Order Entry API, which Lenor has not been granted.

| Endpoint | Used for |
| --- | --- |
| `POST https://identity.amrod.co.za/VendorLogin` | Gets a bearer token, valid 1 hour |
| `GET /api/v1/Products/GetProductsAndBranding` | Products with branding positions and types (falls back to `/api/v1/Products/`) |
| `GET /api/v1/Prices/` | Prices, excluding VAT |
| `GET /api/v1/Stock/` | Stock levels |

Rules the code depends on, checked against Amrod's documentation and a live download of 4,180 products in October 2026:

- **Match on the variant `fullCode`.** A product is a base (`simpleCode`, not sellable) with variants per colour and size; prices and stock belong to variants.
- **Stock type 2 only.** Stock rows come as type 0 (base total), 1 (colour total) and 2 (per variant). Only type 2 is real availability.
- **204 means maintenance.** Every call returns empty between 00:00 and 01:00 SAST.
- **Behaviour flag:** 0 normal, 1 featured, 2 hidden (hidden products are not shown).
- **Branding:** positions → types (`method`) → colour exclusions. `requiredBrandingPositions` must all be chosen when an item is branded; `noCoBrandingPositions` carry a fixed Amrod design. `numberOfColours` is usually "N/A", "Full Colour" or "N Colour(s)". `fullBrandingGuide` is the guide PDF (347 products have none).
- **Don't hammer it.** Amrod updates products and prices daily and stock a few times a day. The site caches products for 10 minutes and stock for 1 minute per server instance.

Amrod's website and API share one login, so a password reset on the website breaks the API until `AMROD_PASSWORD` is updated. `scripts/amrod-branding-sample.mjs --summary` shows what formats Amrod is currently sending.

## How the main features work

**Quotes and branding.** On a product page the customer picks colour, size and quantity, then Unbranded or Branded. Branded shows each Amrod position with a branding-type dropdown; types excluded for the chosen colour are hidden, and required positions must all be filled. Branded items can only be quoted, not added to the cart. The quote basket (`/quote`) lets customers change branding, add notes and a logo, then submit. Guests can submit quotes; each visitor is limited to 10 per hour. The server re-checks every branding choice against Amrod's data before saving.

**Logos.** AI, EPS, PDF, SVG, PNG, JPG, WebP or TIFF, up to 20 MB. The server checks each file's first bytes, not just its name, and rejects anything else. Image files (PNG, JPG and so on) get a warning that screen print, pad print, laser and debossing need vector artwork. Only the customer who uploaded a logo, or an admin, can download it, and it always downloads rather than opening in the browser.

**Cart and checkout.** Checkout requires an account. The server ignores prices sent by the browser and reprices every line from Amrod, checking minimum quantity and live stock. Totals are rounded to the cent per line, then 15% VAT is added. No payment is taken: the order is saved as Pending and Lenor sends an invoice.

**Accounts and admins.** Passwords need 8+ characters and are stored as scrypt hashes. Sessions last 14 days in a signed, HttpOnly cookie. Eight wrong passwords lock that email and address out for 15 minutes. Anyone whose email is in `ADMIN_EMAILS` sees every customer's orders and quotes on `/orders`; everyone else sees only their own.

**Prices.** Shown to everyone by default. Setting `NEXT_PUBLIC_PRICES_REQUIRE_LOGIN=true` removes prices on the server for visitors.

**Email alerts.** For every quote and order, staff get an alert (with the logo attached when under 10 MB, and Reply-To set to the customer) and the customer gets a confirmation from noreply@lenor.co.za. Emails are sent after the page responds; a failed email is logged and never loses the quote or order.

## Checking changes

The repo has no automated test suite yet; adding one is a worthwhile first task. Until then, check changes like this:

1. `pnpm build` must pass (it runs the TypeScript check).
2. Run locally against Amrod and click through: home, product list and filters, a product page with Branded on, quote basket with a logo, sign up, cart, checkout, `/orders` and an order's detail page.
3. Sign in as a second, non-admin account and confirm it cannot see the first account's orders.
4. After a deploy, watch the server's logs with `pm2 logs lenor` (on Vercel: Project → Logs, plus Supabase's Table Editor and Storage).

Useful log lines start with `Lenor:` (catalogue rebuilt, snapshot saved, email sent or failed).

## Known gaps and open work

The code is complete for browsing, quoting and ordering; what remains is mostly outside information and three features.

| Item | State | Waiting on |
| --- | --- | --- |
| Server backups | Not set up | Nothing: a daily backup of /root/lenor/.data/ plus domains.co.za panel backups (see the Lenor Server Deployment Record) |
| Email alerts | Built, switched off | SMTP details for noreply@lenor.co.za and the staff alert address (Lenor) |
| PayFast card payments | Not built | PayFast passphrase, and whether Lenor wants card payment or invoices (Lenor) |
| Orders sent to Amrod | Not built | Amrod Order Entry API access (Lenor to request from Amrod) |
| Contact details | Placeholders (+27 11 234 5678, Sandton address) in the footer, contact page and checkout success page | Lenor's real phone, email, address and hours |
| Admin page | Not built; admins use `/orders` | Nothing: list quotes with logos, change status (Pending → Quoted → Approved) |
| Branding prices and setup fees | Not built | Lenor to decide whether customers see them; data from Amrod `BrandingPrices` |
| Hosting on lenor.co.za | Live since 30 October 2026 | VPS paid monthly (R419); SSH key login still to set up |
| Automated tests | None | Nothing |

Smaller points: login and quote limits are kept per server instance, so they are looser on Vercel. `components/products/product-catalog.tsx`, `filter-sidebar.tsx` and `index.ts` are not used (the shop uses `app/(shop)/products/product-catalog.tsx`) and can be deleted.

## Conventions

- **Commits** are made under the developer's own name and email, with no AI co-author lines.
- **pnpm only.** Keep `pnpm-lock.yaml`; don't add `package-lock.json`.
- **Never commit secrets or data:** `.env*` and `.data/` are git-ignored. Secrets go in the server's `.env.production.local` (or Vercel's settings).
- **Never trust the browser** for prices, stock, branding or who owns a record: the API routes re-check all of it.
- **The Supabase service\_role key stays on the server.** Only files under `lib/store/` use it.
- **Amrod data changes shape.** When Amrod's output looks different, run `node scripts/amrod-branding-sample.mjs --summary` and adjust `lib/branding.ts` or `lib/catalogue.ts`.
- **Keep both storage backends working:** a change to `lib/store/types.ts` needs matching changes in `file-store.ts` and `supabase-store.ts`, plus `supabase/schema.sql` if a column is added.
