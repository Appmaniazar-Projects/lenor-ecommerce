# Deploying Lenor

**Live:** <https://lenor.co.za> runs on Lenor's VPS at domains.co.za (Ubuntu 24.04,
`41.222.36.83`) since 30 October 2026. See [docs/DEPLOYMENT-RECORD.md](docs/DEPLOYMENT-RECORD.md)
for what was done, where everything lives and how SSL renews, and
[docs/HANDOVER.md](docs/HANDOVER.md) for the code and accounts.

Two ways to host it. Both run the same code:

| | VPS (Ubuntu) | Vercel + Supabase |
|---|---|---|
| Storage | `.data/` folder on the server | Supabase (database + file storage) |
| Status | **In use** (lenor.co.za) | Optional, not in use |

## Updating the live site

After pushing to `main`, on the server:

```bash
cd ~/lenor && git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart lenor
```

Docs-only changes need just `git pull`. After changing `.env.production.local`,
run `pnpm build && pm2 restart lenor`.

---

## Option A: VPS (Ubuntu) — current

This is how lenor.co.za was set up (as root). Steps 3 and 5 are written non-interactively; the original run answered the same prompts by hand.
Leave `SUPABASE_URL` empty and the site stores everything in `.data/` next to
the app. Run **one** process only (no PM2 cluster mode) and **back up `.data/`**.

### 1. Server prep

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
apt update && apt upgrade -y          # reboot if a new kernel was installed
```

The build needs the swap on a 4 GB server.

### 2. Server software and firewall

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx
npm i -g pnpm pm2
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

Install nginx before `ufw allow 'Nginx Full'`, or ufw can't find the profile.

### 3. Access to the code

The repo is private, so the server uses a read-only deploy key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/lenor_deploy -N "" -C lenor-vps
cat ~/.ssh/lenor_deploy.pub     # GitHub repo → Settings → Deploy keys → Add (read-only)
printf 'Host github.com\n  IdentityFile ~/.ssh/lenor_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
git clone git@github.com:Appmaniazar-Projects/lenor-ecommerce.git ~/lenor
```

Answer the first GitHub host-key prompt with the full word `yes`.

### 4. App

```bash
cd ~/lenor
cp .env.example .env.production.local
nano .env.production.local     # Amrod details, NEXT_PUBLIC_APP_URL=https://lenor.co.za, ADMIN_EMAILS
pnpm install --frozen-lockfile
pnpm build
pm2 start pnpm --name lenor -- start
pm2 save && pm2 startup        # starts the pm2-root service at boot
```

pnpm's "Ignored build scripts: sharp" warning is harmless.

### 5. Nginx and SSL

`/etc/nginx/sites-available/lenor`:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name lenor.co.za www.lenor.co.za;
  client_max_body_size 25m;   # logo uploads (app limit is 20 MB)

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
  }
}
```

```bash
ln -s /etc/nginx/sites-available/lenor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
certbot --nginx -d lenor.co.za -d www.lenor.co.za -m support@appmaniazar.co.za --agree-tos --redirect
```

Let's Encrypt is free and Certbot renews it automatically. Check with
`certbot renew --dry-run`; full SSL steps are in the deployment record.

### 6. DNS

`@` and `www` must point to the VPS IP (they already did for lenor.co.za).
Leave the MX records alone: email is hosted separately.

### 7. Backups (still to set up)

```bash
mkdir -p ~/backups
(crontab -l 2>/dev/null; echo '0 2 * * * tar czf ~/backups/lenor-data-$(date +\%F).tgz -C ~/lenor .data') | crontab -
```

Also switch on backups in the domains.co.za VPS panel, so a copy lives off the server.

---

## Option B: Vercel + Supabase (optional)

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

---

## Notes (both)

- Amrod returns empty responses 00:00–01:00. The site keeps serving the last
  saved catalogue.
- Admins (`ADMIN_EMAILS`) see every order and quote on `/orders`.
- Payment is offline until the PayFast passphrase is set up: orders are saved
  and Lenor sends an invoice.
