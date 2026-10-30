# Lenor Server Deployment Record

Last updated 30 October 2026. See also [HANDOVER.md](HANDOVER.md) and [DEPLOY.md](../DEPLOY.md).

The Lenor website went live on lenor.co.za on 30 October 2026, running on Lenor's own VPS at domains.co.za with a free Let's Encrypt SSL certificate. This record covers how it was set up, where everything is, and how to keep it running.

## Server at a glance

No passwords or keys are written here. The root password is in the domains.co.za portal under VPS Hosting → server.lenor.co.za → VPS Password.

| Item | Value |
| --- | --- |
| Provider | domains.co.za, "Linux Epyc VPS 2", region za-jhb-lnx-2 (Johannesburg) |
| Cost | R419 a month; next payment was due 1 November 2026 |
| Server name | server.lenor.co.za (the VPS's own name; not used by the website) |
| IP addresses | IPv4 `41.222.36.83`, IPv6 `2c0f:f850:dc22:c977::1` |
| System | Ubuntu 24.04 LTS, 3.8 GB memory, 2 GB swap (added), 100 GB disk |
| Log in | `ssh root@41.222.36.83` (password) |
| Website | https://lenor.co.za and https://www.lenor.co.za |
| Domain DNS | Already pointed `@` and `www` at `41.222.36.83` before the deployment; DNS is run on ns1/ns2.clusterdns.co.za, ns3.hostdns.co.za, ns4.clusterdns.org, not in the VPS account |
| Email | Separate service (MX: mx1.tld-mx.com, mx2.tld-mx.net); untouched by the website |
| SSL | Let's Encrypt via Certbot, free, renews automatically; registered to support@appmaniazar.co.za |
| Software | Node.js 22, pnpm 10, PM2, Nginx 1.24, Certbot 2.9 |
| Code | github.com/Appmaniazar-Projects/lenor-ecommerce, branch `main`, first deployed at commit `d2d225d` |
| Data storage | Files in `/root/lenor/.data/` on the server (Supabase not used here) |

Docker was already installed on the server before this deployment. Nothing runs in it and the website does not use it.

## What was done

The deployment took about an hour on 30 October 2026, following `DEPLOY.md` in the repo.

1. **Checked DNS.** `nslookup` showed lenor.co.za and www.lenor.co.za already pointed at the VPS, and email on a separate service, so no DNS changes were needed.
2. **Logged in and checked the server.** Only SSH was running; nothing was using the web ports.
3. **Added 2 GB of swap**, because the server had none and the build needs headroom on 3.8 GB of memory.
4. **Updated Ubuntu** (`apt update && apt upgrade -y`). It installed a new kernel, so the server was rebooted.
5. **Installed the software:** Node.js 22 from NodeSource, Git, Nginx, Certbot, then pnpm and PM2 through npm.
6. **Turned on the firewall** (ufw), allowing only SSH (port 22) and web traffic (ports 80 and 443).
7. **Gave the server read access to the code:** created an SSH key at `/root/.ssh/lenor_deploy`, added it to the GitHub repo as a read-only deploy key named `lenor-vps`, and cloned the repo to `/root/lenor`.
8. **Created the settings file** `/root/lenor/.env.production.local` with the Amrod login, `NEXT_PUBLIC_APP_URL=https://lenor.co.za` and the admin emails.
9. **Built and started the site:** `pnpm install --frozen-lockfile`, `pnpm build`, then `pm2 start pnpm --name lenor -- start`, `pm2 save` and `pm2 startup` so it restarts after a reboot.
10. **Set up Nginx** to forward lenor.co.za and www.lenor.co.za to the site on port 3000, with a 25 MB upload limit for logos.
11. **Added SSL** with `certbot --nginx -d lenor.co.za -d www.lenor.co.za`, using support@appmaniazar.co.za as the contact email and redirecting HTTP to HTTPS.

**Snags hit along the way**

- `ufw allow 'Nginx Full'` failed the first time with "Could not find a profile matching 'Nginx Full'", because Nginx wasn't installed yet. Running it again after installing Nginx fixed it.
- The Ubuntu update installed a new kernel and asked for a reboot before continuing.
- SSH's first connection to GitHub asks to confirm GitHub's key; it only accepts the full word `yes`.
- pnpm warns "Ignored build scripts: sharp". This is harmless: the site doesn't use sharp's image resizing.

## Where things live on the server

| Path or name | What it is |
| --- | --- |
| `/root/lenor` | The website's code (a Git clone of the repo) |
| `/root/lenor/.env.production.local` | Settings: Amrod login, site address, admin emails. Never commit or share it |
| `/root/lenor/.data/` | All customer data: accounts, quotes, orders, uploaded logos, catalogue snapshot, login-cookie secret. Back this up |
| `/etc/nginx/sites-available/lenor` | Nginx config for lenor.co.za (Certbot added the HTTPS parts) |
| `/etc/letsencrypt/live/lenor.co.za/` | The SSL certificate files |
| `/root/.ssh/lenor_deploy` | The server's read-only GitHub deploy key |
| PM2 process `lenor` | Runs the site on port 3000; started at boot by the `pm2-root` service |
| `/swapfile` | 2 GB swap, switched on at boot via `/etc/fstab` |

Port 3000 is only reachable from the server itself; the firewall lets in only ports 22, 80 and 443.

## SSL certificate

The certificate is free from Let's Encrypt and covers lenor.co.za and www.lenor.co.za. Each certificate lasts 90 days, and Certbot renews it automatically about 30 days before it expires, so normally nobody needs to do anything. Expiry warnings and Let's Encrypt notices go to **support@appmaniazar.co.za**. There is no need to buy the SSL product in the domains.co.za portal.

**Check the certificate and its expiry date**

```bash
certbot certificates
```

It lists each certificate with its domains and "Expiry Date ... (VALID: N days)".

**Check automatic renewal is switched on**

```bash
systemctl list-timers | grep certbot
certbot renew --dry-run
```

The first shows when Certbot next checks (twice a day). The second tests a renewal without changing anything and should end with "Congratulations, all simulated renewals succeeded".

**Renew by hand** (only if automatic renewal has failed or the certificate is close to expiry)

```bash
certbot renew
systemctl reload nginx
```

`certbot renew` only replaces certificates within 30 days of expiry. To force one now, add `--force-renewal`; avoid doing that often, as Let's Encrypt limits how many certificates a domain can get per week.

**Change the contact email**

```bash
certbot update_account --email new-address@example.com
```

**Add another address to the certificate** (for example a new subdomain, after its DNS points at the server)

```bash
certbot --nginx --expand -d lenor.co.za -d www.lenor.co.za -d shop.lenor.co.za
```

List every address the certificate should cover, old and new.

**Renewal needs three things to stay true:** lenor.co.za and www still point at `41.222.36.83`, port 80 stays open in the firewall (Let's Encrypt checks over HTTP), and Nginx is running. If renewal fails, check those first (see the next sections), then run `certbot renew --dry-run` again to see the exact error.

## Updating the site and changing settings

**Put new code live** (after it has been pushed to `main` on GitHub):

```bash
cd ~/lenor && git pull && pnpm install --frozen-lockfile && pnpm build && pm2 restart lenor
```

The site stays up during the build and is down for a few seconds during the restart. If the build fails, the old version keeps running; fix the error and run the line again.

**Change a setting** (for example to add the email or PayFast details later):

```bash
cd ~/lenor && nano .env.production.local
pnpm build && pm2 restart lenor
```

A rebuild is needed because settings starting with `NEXT_PUBLIC_` are built into the site; for other settings `pm2 restart lenor` alone is enough.

**Update Ubuntu** (monthly is sensible):

```bash
apt update && apt upgrade -y
```

If it says a restart is needed, run `reboot`. The site, Nginx and the swap all come back on their own; check with `pm2 status` after logging back in.

## When something breaks

| Symptom | Check | Fix |
| --- | --- | --- |
| Site doesn't load at all | `pm2 status`, `systemctl status nginx` | `pm2 restart lenor`, `systemctl restart nginx` |
| "502 Bad Gateway" | The site process stopped: `pm2 logs lenor --lines 50` | Fix the error shown, then `pm2 restart lenor` |
| No products, or an Amrod error in the logs | `pm2 logs lenor --lines 50` | Between 00:00 and 01:00 Amrod is down for maintenance and the site serves its saved catalogue. Outside that, check the Amrod login in `.env.production.local`; Amrod's website and API share a password, so a website password reset breaks the API |
| Logo upload fails for big files | Nginx's `client_max_body_size 25m` in `/etc/nginx/sites-available/lenor` | Keep it above the site's 20 MB limit, then `nginx -t && systemctl reload nginx` |
| Browser warns about the certificate | `certbot certificates` | See the SSL section: `certbot renew` |
| Can't log in to the website after a change | `NEXT_PUBLIC_APP_URL` must be `https://lenor.co.za` | Fix it, then `pnpm build && pm2 restart lenor` |
| Server feels slow or the build is killed | `free -h` (swap should show 2.0Gi) | Re-add swap if missing |

After changing the Nginx config, always run `nginx -t` before `systemctl reload nginx`: it catches mistakes without taking the site down.

## Still to do on the server

- [ ] Pay the VPS bill (R419 a month, due 1 November 2026) so the server isn't suspended.
- [ ] Set up daily backups of `/root/lenor/.data/`: `mkdir -p ~/backups && (crontab -l 2>/dev/null; echo '0 2 * * * tar czf ~/backups/lenor-data-$(date +\%F).tgz -C ~/lenor .data') | crontab -`
- [ ] Switch on Backups in the domains.co.za VPS panel, so there's a copy off the server.
- [ ] Test on the live site: sign up, request a quote with a logo, place an order, and check `/orders` as an admin.
- [ ] Add the email (SMTP) settings for noreply@lenor.co.za once Lenor sends them, then rebuild.
- [ ] Make logging in safer: set up an SSH key for admin logins, then turn off password login for root.
- [ ] Optionally run the site as a normal user instead of root.
