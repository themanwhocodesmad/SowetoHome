# Soweto Stays

Property booking platform (MERN, TypeScript). See [claude_plan.md](claude_plan.md) for the
full architecture and design rationale — this file is just the practical "how to run it" guide.

## Stack

- **API**: Express + TypeScript, MongoDB (Atlas) via Mongoose, Passport (Google OAuth2) + JWT
- **Worker**: BullMQ + Redis for background jobs (emails, check-in reminders, rating prompts)
- **Web**: React + TypeScript (Vite), TanStack Query, React Router
- **Shared**: `packages/shared` (types/Zod schemas/constants) and `packages/db` (Mongoose models), used by both `apps/api` and `apps/worker`

## Prerequisites

- Node.js 22+
- A MongoDB Atlas cluster (or any MongoDB instance)
- Redis (only needed to actually process background jobs — the API boots fine without it, just logs connection retries)
- A Google Cloud OAuth 2.0 Client ID (type "Web application")

## First-time setup

1. `npm install` (installs all workspaces)
2. `cp .env.example .env` and fill in the values — see comments in that file for where each one comes from
3. Two things must be configured **outside** this repo before sign-in/DB access will work:
   - **Google Cloud Console** → your OAuth client → *Authorized redirect URIs* must include the exact value of `GOOGLE_CALLBACK_URL` (e.g. `http://localhost:4000/api/auth/google/callback`). Without this, sign-in fails with `redirect_uri_mismatch`.
   - **MongoDB Atlas** → Network Access → your current IP (or `0.0.0.0/0` for unrestricted dev access) must be allow-listed, or every connection attempt fails with a `MongooseServerSelectionError`.
4. `npm run dev:api`, `npm run dev:worker`, `npm run dev:web` (each in its own terminal)
   - API: http://localhost:4000
   - Web: http://localhost:5173

## Scripts (run from the repo root)

| Command | What it does |
|---|---|
| `npm run dev:api` / `dev:worker` / `dev:web` | Run one app in watch mode |
| `npm run build` | Build every package/app (shared → db → api/worker/web, in that order) |
| `npm run typecheck` | Typecheck the whole monorepo |
| `npm run lint` | ESLint across the whole monorepo |

## Docker Compose (local, prod-like)

```
docker compose up --build
```

Starts Redis + the `api`, `worker`, and `web` containers. Web is served by Nginx on port
5173; the API is published on port 4000. This does **not** include MongoDB — it connects to
whatever `MONGO_URI` in `.env` points to (Atlas by default). Uploaded property images persist
in the `uploads-data` Docker volume across rebuilds — back this up separately, since it isn't
covered by any MongoDB backup.

## Deploying to a VPS

1. Point your domain's DNS at the VPS.
2. `docker compose up --build -d` on the VPS (same `.env`, with production values — real PayFast
   live/sandbox keys, a real SMTP provider, `NODE_ENV=production`, and `CLIENT_URL`/`API_PUBLIC_URL`/
   `GOOGLE_CALLBACK_URL` updated to your real domain).
3. Install Nginx + certbot **on the VPS itself** (outside Docker) and adapt
   [deploy/nginx.reverse-proxy.conf.example](deploy/nginx.reverse-proxy.conf.example) with your real
   domain — this fronts both containers on port 443 and is what makes PayFast's ITN webhook
   (`/api/payments/payfast/notify`) reachable from the public internet.
4. Set up a cron job that backs up both the MongoDB Atlas data (or `mongodump` if self-hosting Mongo)
   and the `uploads-data` volume to storage outside the VPS.

## Known gaps (read before treating this as production-ready)

These are called out in more detail in [claude_plan.md](claude_plan.md) §3, but concretely, as of this build:

- **No automated test suite.** Typecheck/lint/build all pass, and the API was smoke-tested locally
  (it boots, validates env, reaches MongoDB Atlas and gracefully degrades without Redis), but there
  are no unit/integration tests yet. Recommended next slice.
- **PayFast integration is unverified against a live sandbox.** The signature generation and ITN
  handling follow PayFast's documented pattern, but this environment has no network path to
  actually run a sandbox transaction end-to-end. Test a real payment before trusting this with money.
- **PayFast has no payout/refund API** — sending a host their share, or refunding a guest, is a
  manual bank EFT / manual dashboard action that an admin records in the app (see the Payouts admin page).
- **Emails log instead of send** until `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` are filled in.
