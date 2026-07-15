# Soweto Stays

Property booking platform (MERN, TypeScript). See [claude_plan.md](claude_plan.md) for the
full architecture and design rationale — this file is just the practical "how to run it" guide.

## Stack

- **API**: Express + TypeScript, MongoDB (Atlas) via Mongoose, Google sign-in (GIS ID-token flow) + JWT
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
   - **Google Cloud Console** → your OAuth client → *Authorized JavaScript origins* must include the origin the web app is served from (`http://localhost:5173` for dev). The GIS credential flow needs no client secret and no redirect URI — just the client id, in both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
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

## Docker Compose / deploying

`docker-compose.yml` is the **production deploy config** (Caddy terminates HTTPS for
`$DOMAIN` and reverse-proxies to the internal `api`/`web` containers; only Caddy publishes
ports). See [DEPLOY.md](DEPLOY.md) for the full droplet runbook — one-time setup, the
production `.env`, deploy/rollback steps, and what to back up. Local development doesn't
use compose; run the three `npm run dev:*` processes instead.

## Known gaps (read before treating this as production-ready)

These are called out in more detail in [claude_plan.md](claude_plan.md) §3, but concretely, as of this build:

- **No automated test suite.** Typecheck/lint/build all pass, and the API was smoke-tested locally
  (it boots, validates env, reaches MongoDB Atlas and gracefully degrades without Redis), but there
  are no unit/integration tests yet. Recommended next slice.
- **Yoco integration is unverified against a live sandbox.** The webhook signature verification and
  checkout flow follow Yoco's documented pattern, but this environment has no network path to
  actually run a sandbox transaction end-to-end. Test a real payment before trusting this with money.
- **Yoco has no payout/refund API wired up** — sending a host their share, or refunding a guest, is a
  manual bank EFT / manual dashboard action that an admin records in the app (see the Payouts admin page).
- **Emails log instead of send** until `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` are filled in.
