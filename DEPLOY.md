# Deploying Lenor

Two ways to host it. Both run the same code:

| | Vercel + Supabase | VPS (Ubuntu) |
|---|---|---|
| Storage | Supabase (database + file storage) | `.data/` folder on the server |
| Set up when | Now | When the lenor.co.za server is paid for |

---

## Option A: Vercel + Supabase

### 1. Supabase (5 minutes)

1. Create a free project at <https://supabase.com>. Pick the region closest to
   South Africa that's offered, and save the database password somewhere safe.
2. **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
   It creates the tables and two private storage buckets. Running it again is safe.
3. **Project Settings → API**: copy the **Project URL** and the
   **service_role / secret** key. The secret key gives full access: only put it
   in Vercel's environment variables, never in code, chat or a `NEXT_PUBLIC_` variable.

Free Supabase projects pause after a week without visits. Open the dashboard
to wake it, or upgrade before real customers use the site.

### 2. Vercel

1. In the Vercel dashboard, open the `lenor-ecommerce` project (or **Add New →
   Project** and import `Appmaniazar-Projects/lenor-ecommerce`).
2. **Settings → Environment Variables**, for Production (and Preview if you use it):

   | Name | Value |
   |---|---|
   | `AMROD_API_URL` | `https://vendorapi.amrod.co.za` |
   | `AMROD_USERNAME`, `AMROD_PASSWORD`, `AMROD_CUSTOMER_CODE` | from Amrod |
   | `SUPABASE_URL` | Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
   | `SESSION_SECRET` | 48+ random characters, e.g. `openssl rand -base64 48` |
   | `CRON_SECRET` | another long random string |
   | `NEXT_PUBLIC_APP_URL` | the site address, e.g. `https://lenor-ecommerce.vercel.app` |
   | `ADMIN_EMAILS` | Lenor staff emails, comma separated |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `NOTIFY_EMAILS` | when the noreply mailbox details arrive |

3. **Settings → Build and Deployment**: Install Command `pnpm install`
   (Vercel detects pnpm from `pnpm-lock.yaml`), Node.js 20 or later.
4. **Deployments → Redeploy** (environment variables only apply to new deployments).

`NEXT_PUBLIC_APP_URL` is built into the site. Redeploy after changing it.

### 3. Check it

- Home page and a product page show Amrod products with prices.
- Register, sign in, request a quote with a logo, place an order.
- In Supabase **Table Editor**, the quote and order appear in `lenor_quotes` and
  `lenor_orders`; the logo is in **Storage → lenor-logos**.

### How it behaves on Vercel

- Logos (up to 20 MB) upload straight from the browser to Supabase Storage,
  because Vercel limits requests to about 4.5 MB. The server then checks the file
  and deletes anything that isn't a real logo file.
- The Amrod catalogue is cached in Supabase Storage (`lenor-cache`), so a fresh
  Vercel instance answers quickly. A cron job (`vercel.json`) refreshes it daily
  at 01:30 SAST, after Amrod's maintenance hour.
- Login and quote rate limits are per Vercel instance, so they're looser than on a VPS.

---

## Option B: VPS (Ubuntu)

Leave `SUPABASE_URL` empty and the site stores everything in `.data/` next to
the app. Run **one** process only (no PM2 cluster mode) and **back up `.data/`**.
(Or set the Supabase variables here too and keep using Supabase.)

### 1. Server software

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm i -g pnpm pm2
```

### 2. App

```bash
git clone https://github.com/Appmaniazar-Projects/lenor-ecommerce ~/lenor
cd ~/lenor
cp .env.example .env.production.local
nano .env.production.local     # Amrod details, URL, SESSION_SECRET, ADMIN_EMAILS
pnpm install --frozen-lockfile
pnpm build
pm2 start "pnpm start" --name lenor
pm2 save && pm2 startup        # run the command it prints
```

Update: `git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart lenor`

### 3. Nginx

`/etc/nginx/sites-available/lenor`:

```nginx
server {
  server_name lenor.co.za www.lenor.co.za;
  client_max_body_size 25m;   # logo uploads (app limit is 20 MB)

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lenor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d lenor.co.za -d www.lenor.co.za
```

### 4. DNS (domains.co.za)

A records for `@` and `www` pointing to the VPS IP. Leave MX records alone.

### 5. Backups

```bash
0 2 * * * tar czf ~/backups/lenor-data-$(date +\%F).tgz -C ~/lenor .data
```

Copy `~/backups` somewhere off the server.

---

## Notes (both)

- Amrod returns empty responses 00:00–01:00. The site keeps serving the last
  saved catalogue.
- Admins (`ADMIN_EMAILS`) see every order and quote on `/orders`.
- Payment is offline until the PayFast passphrase is set up: orders are saved
  and Lenor sends an invoice.
