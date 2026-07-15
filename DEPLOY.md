# Deploying to the droplet

Production runs on a DigitalOcean droplet (`159.203.186.175`) with `docker compose`,
mirroring the Pannotia setup: **Caddy** is the only container with published ports and
terminates HTTPS with an automatic Let's Encrypt certificate for `$DOMAIN`; the `api`,
`worker`, `web`, and `redis` containers live on the internal compose network. MongoDB is
external (Atlas) via `MONGO_URI`.

- **Domain**: `159-203-186-175.sslip.io` — sslip.io resolves it to the droplet with zero
  DNS setup. To move to a real domain later: point an A record at the droplet, change
  `DOMAIN` in the droplet's `.env`, rebuild `web` (the origin is baked into the bundle),
  and add the new origin in Google Cloud Console.
- **Code location on droplet**: `/root/SowetoHome`
- **Deployable branch**: `master` (tag each deploy: `deploy-YYYY-MM-DD`)

## One-time droplet setup

```bash
ssh root@159.203.186.175

# Docker (includes the compose plugin)
curl -fsSL https://get.docker.com | sh

# Firewall: SSH + HTTP/HTTPS only (skip if you manage this with a DO Cloud Firewall instead)
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443 && ufw enable

git clone https://github.com/themanwhocodesmad/SowetoHome.git /root/SowetoHome
cd /root/SowetoHome
nano .env    # see "Production .env" below
```

Then, outside the droplet:

1. **MongoDB Atlas** → Network Access → add `159.203.186.175`, or connections fail with
   `MongooseServerSelectionError`. (Remove any old dev-only `0.0.0.0/0` entry when you do.)
2. **Google Cloud Console** → APIs & Services → Credentials → the OAuth client → add
   `https://159-203-186-175.sslip.io` to **Authorized JavaScript origins** (the GIS
   credential flow uses JS origins, not redirect URIs). Keep `http://localhost:5173` there
   for local dev.
3. If the droplet has a **DO Cloud Firewall** attached: allow inbound TCP 22, 80, 443 and
   UDP 443 (HTTP/3).

## Production .env (on the droplet, never committed)

`docker compose` reads this from `/root/SowetoHome/.env`. `CLIENT_URL`, `API_PUBLIC_URL`,
`REDIS_URL`, and `NODE_ENV` are derived/overridden in docker-compose.yml — you don't set
them here. Any **new required var added to `env.ts` must be added here too**, or the api
container crash-loops on boot.

```bash
DOMAIN=159-203-186-175.sslip.io

MONGO_URI=mongodb+srv://<user>:<password>@cluster0.cyvhxue.mongodb.net/sowetostays?appName=Cluster0

# Generate fresh ones for prod: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

GOOGLE_CLIENT_ID=955363517043-bdvhectf6cofcqfovbdm36ka4bot12n6.apps.googleusercontent.com

# Same generator as the JWT secrets
REDIS_PASSWORD=

# From Yoco App > Sales > Payment Gateway (sk_live_... in prod). Get the whsec_... webhook
# secret by calling the Checkout API directly (not the dashboard UI): POST
# https://payments.yoco.com/api/webhooks with "Authorization: Bearer <YOCO_SECRET_KEY>" and
# body {"name": "...", "url": "https://<DOMAIN>/api/payments/yoco/notify"} - the response's
# "secret" field is shown only once. Re-run this with the live key when going to prod; the
# test-mode secret above does not carry over.
YOCO_SECRET_KEY=
YOCO_WEBHOOK_SECRET=

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=BookMyStay <no-reply@yourdomain>

UPLOAD_DIR=uploads
```

## Deploying a release

```bash
ssh root@159.203.186.175
cd /root/SowetoHome

git fetch origin && git checkout master && git pull --ff-only   # 1. pull the release
docker compose build                                            # 2. build while old version keeps serving
docker compose up -d                                            # 3. recreate containers (brief downtime)
curl -s https://159-203-186-175.sslip.io/health                 # 4. verify -> {"status":"ok"}

git tag deploy-$(date +%F) && git push origin --tags            # 5. tag the deploy
```

First boot: Caddy needs ~10-30s to obtain the Let's Encrypt certificate; check
`docker compose logs caddy` if HTTPS doesn't come up.

## Rollback

```bash
cd /root/SowetoHome
git checkout <previous-deploy-tag>
docker compose build && docker compose up -d
```

## What to back up

- **`uploads-data` volume** — property images live on disk, not in Mongo. A Mongo backup
  does not cover them.
- **MongoDB Atlas** — enable Atlas backups (or scheduled `mongodump` off-box).
- **`caddy-data` volume** — holds the TLS certificates. Not precious (Caddy reissues), but
  deleting it repeatedly can hit Let's Encrypt rate limits.

## Ports & security posture

- Public: 80/443 (Caddy only). `api:4000`, `web:80`, `redis:6379` are `expose`-only —
  reachable on the compose network, never from the internet.
- Redis is password-protected (`REDIS_PASSWORD`) even though it isn't published.
- Everything is same-origin behind Caddy (`/api` + `/uploads` → api, rest → web SPA), so
  there is no CORS surface in production and the `sameSite=lax` refresh cookie just works.
- Yoco's webhook (`/api/payments/yoco/notify`) is publicly reachable through Caddy, which is
  required for payments to confirm.
