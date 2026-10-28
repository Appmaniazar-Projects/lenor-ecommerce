# Deploying Lenor to the VPS

The site runs as one Node.js process behind Nginx. Customers, orders, quotes
and logos are stored as files in `.data/` next to the app, so **one server
process only** (no PM2 cluster mode) and **back up `.data/`**.

## 1. Server software (Ubuntu)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm i -g pnpm pm2
```

Node 20.9 or later is required.

## 2. App

```bash
git clone https://github.com/Appmaniazar-Projects/lenor-ecommerce ~/lenor
cd ~/lenor
cp .env.example .env.production.local
nano .env.production.local     # fill in Amrod details, URL, SESSION_SECRET, ADMIN_EMAILS
pnpm install --frozen-lockfile
pnpm build
pm2 start "pnpm start" --name lenor
pm2 save && pm2 startup        # run the command it prints
```

`NEXT_PUBLIC_APP_URL` must be the real `https://` address (it is baked in at
build time and decides whether login cookies are `Secure`). Rebuild after
changing it.

Generate a session secret with `openssl rand -base64 48`.

### Updating

```bash
cd ~/lenor && git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart lenor
```

## 3. Nginx

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

## 4. DNS (domains.co.za)

A records for `@` and `www` pointing to the VPS IP. Leave MX records alone.

## 5. Backups

`.data/` holds every customer account, order, quote and logo. Copy it off the
server daily, for example with a cron job:

```bash
0 2 * * * tar czf ~/backups/lenor-data-$(date +\%F).tgz -C ~/lenor .data
```

and sync `~/backups` somewhere else (another server, cloud storage).

## Notes

- Amrod returns empty responses during its maintenance hour (00:00–01:00).
  The site keeps serving the last catalogue it saved in
  `.data/catalogue-snapshot.json`.
- Admins (emails in `ADMIN_EMAILS`) see every order and quote on `/orders`
  and can download uploaded logos.
- Payment is offline for now: orders are saved and Lenor sends an invoice.
  PayFast needs the passphrase before it can be switched on.
