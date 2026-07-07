# Soweto Stays — Architecture & Build Plan

Placeholder name: **Soweto Stays**. Airbnb-style property booking platform. MERN stack (MongoDB, Express, React, Node), TypeScript on both ends, built incrementally in vertical slices.

This document is the living plan. Section 2 captures decisions made during the initial interview — revisit and update it as decisions change.

---

## 1. Goals & Constraints

- Solo developer, side-project pace. Architecture should be **enterprise-quality in discipline** (typed, layered, tested, observable) **without enterprise-scale operational overhead** (no k8s, no service mesh, no multi-repo microservices).
- Deployed to a self-hosted VPS (e.g. DigitalOcean droplet), not a managed cloud platform.
- Currency: ZAR. Timezone: Africa/Johannesburg (SAST, UTC+2) — store all timestamps in UTC, convert at the edges.
- Guests can search without an account; booking requires an account.

---

## 2. Decisions & Assumptions (from interview)

| Topic | Decision | Notes |
|---|---|---|
| Payment gateway | **PayFast** | South African gateway. See §8 for a real limitation this creates. |
| Scale/team | Solo dev | Drives the "modular monolith, not microservices" call in §6. |
| Hosting | Self-hosted VPS | Docker Compose based deployment, manual/simple CI-triggered deploy. |
| Chat/messaging | **Out of scope** for v1 | Can be added as a later slice (Slice 11+). |
| Auth | **Google OAuth2 only** (passport-google-oauth20) | No password storage/reset flow needed for v1. Email/password can be added later without disrupting the User schema (see §7.1). |
| Property "stay duration" | **min_nights / max_nights** per listing | Actual check-in/check-out dates are chosen per booking, constrained by these bounds. |
| Image storage | **VPS local disk** | Simpler, no third-party account — but see §11 (backups) for the tradeoff this creates. |
| Cancellation policy | **Simple flat rule**: full refund if cancelled more than 24–48h before check-in, otherwise no refund | Not host-configurable in v1. Exact cutoff (24h vs 48h) — pick one when we build Slice 7; defaulting to 48h as slightly more guest-friendly unless you'd rather 24h. |
| User roles | **Single account, multiple roles** (assumption) | A user can be a guest and later add a host role on the same account, rather than separate account types per role. Admin is an internal-only role, assigned by another admin (never self-service). Flag if you actually want strictly separate account types. |
| Admin fee | Configurable percentage, stored as a platform setting (not hardcoded) | Exact % is a business decision you can set at launch and change later without a code deploy. |
| Email provider | Recommend a transactional email API (e.g. Brevo, SendGrid, Mailgun free tier) via Nodemailer, **not** raw SMTP from the VPS's own IP | VPS IPs have poor sender reputation by default; this hurts deliverability (emails land in spam). Swappable later since Nodemailer abstracts the transport. |
| Admin listing creation | Admins **never own** listings. Creating/editing a listing as an admin requires selecting an existing host account to attach it to (support/on-behalf-of use case), never an admin-owned property | Matches the brief's framing of admins as account/issue/payment handlers, not property owners. Enforced at the schema level: `Property.hostId` must always reference a user with the `host` role, never an admin-only user. |

---

## 3. Open Risks / Needs Verification

These aren't blockers to starting, but they're real gaps worth knowing about now rather than discovering mid-build:

1. **PayFast has no built-in marketplace payout/split feature** (unlike Stripe Connect). It's built to *receive* payments into your merchant account, not to *disburse* funds to third parties (hosts) automatically. Practical implication: "admin sends the host their share" will likely be a **manual EFT process** tracked in the admin dashboard (Slice 5), not a one-click automated payout via PayFast's API — at least in v1. If you find a PayFast payout/EFT API when we get there, we can automate it.
2. **PayFast refunds**: need to confirm at implementation time whether refunds can be triggered via API or require action in the PayFast merchant dashboard. This affects how automated the cancellation flow (Slice 7) can be.
3. **Image storage on VPS disk**: no CDN, and the images are only as durable as your backup strategy. Slice 0/10 must include automated backups of the uploads directory, not just the database.
4. **PayFast ITN (webhook) validation**: PayFast confirms payment via a server-to-server "Instant Transaction Notification" callback. This must be validated (signature + a server-side confirmation call back to PayFast) before trusting it — never mark a booking "paid" purely because the browser redirected back successfully.

---

## 4. Tech Stack

**Backend**
- Node.js + Express, TypeScript (strict mode)
- MongoDB + Mongoose
- Redis + BullMQ (background jobs / scheduled notifications)
- Passport.js (`passport-google-oauth20`) + JWT (access token + httpOnly-cookie refresh token)
- Zod (request validation + env var validation)
- Pino (structured logging)

**Frontend**
- React + TypeScript (Vite)
- TanStack Query (server-state/caching) — lighter than Redux for this scope
- React Router v6, with role-scoped route trees (`/guest`, `/host`, `/admin`)
- A component library base (e.g. Tailwind + Radix/shadcn) — your call when we get to Slice 0/2 UI work

**Shared**
- A `packages/shared` workspace package holding TypeScript types/DTOs and Zod schemas used by both the API and the web app, so request/response shapes can't drift between frontend and backend.

**Infra**
- Docker Compose: `api`, `worker`, `web` (built static bundle behind Nginx), `mongo`, `redis`, `nginx` (reverse proxy + TLS via certbot)
- GitHub Actions: lint + typecheck + test on every push/PR (cheap insurance even solo)

---

## 5. Repository Structure

```
soweto-stays/
├── apps/
│   ├── api/                     # Express + TS REST API
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── properties/
│   │       │   ├── bookings/
│   │       │   ├── payments/    # PayFast checkout + ITN webhook
│   │       │   ├── payouts/     # admin -> host payout tracking
│   │       │   ├── reviews/
│   │       │   └── admin/
│   │       ├── common/          # middleware, error classes, logger, config loader
│   │       ├── app.ts
│   │       └── server.ts
│   ├── worker/                  # BullMQ processor: emails, 24h reminders, 24h rating prompts
│   │   └── src/
│   └── web/                     # React + TS frontend
│       └── src/
│           ├── pages/{guest,host,admin}/
│           ├── components/
│           └── features/
├── packages/
│   └── shared/                  # shared types, DTOs, zod schemas
├── docker-compose.yml
├── .github/workflows/ci.yml
└── claude_plan.md
```

Each API module follows the same internal layering:
`routes.ts → controller.ts (thin) → service.ts (business logic) → repository.ts (data access) → model.ts (Mongoose schema)`, plus `validation.ts` (Zod schemas) and `types.ts`. This is the main lever for "enterprise-grade" discipline without needing separate deployables.

---

## 6. Monolith vs. Microservices — investigated

Given a solo developer on a single VPS, **true microservices (separate repos/deployables) are not worth it** — they'd add network calls, service discovery, and multi-service deploys for no real benefit at this scale.

Instead, this plan gets most of the *benefit* of service separation via a **modular monolith + one background worker process**:

- The `api` app handles synchronous HTTP requests only.
- The `worker` app (same codebase/monorepo, separate entry point and container) consumes a Redis/BullMQ queue for anything that shouldn't block a request or needs delayed scheduling: sending emails, the 24h-before-checkin reminder, the 24h-after-checkout rating prompt, and (later) payout-status emails.
- This gives you async processing and independent scaling of the worker without owning multiple codebases, CI pipelines, or inter-service auth.

If the project ever outgrows this (real scale, a team forms), the module boundaries in `apps/api/src/modules/*` are already where you'd cut the seams — each module has no direct dependency on another module's internals, only on shared types.

---

## 7. Domain Models

### 7.1 User
```
User {
  _id
  googleId          // from Google OAuth2, unique
  email
  name
  avatarUrl
  roles: ('guest' | 'host' | 'admin')[]   // guest is default; host can be added; admin is internally assigned
  phone?
  payoutDetails?: { bankName, accountNumber, accountHolder }  // for hosts, used for manual EFT payouts
  isSuspended: boolean       // admin moderation
  createdAt, updatedAt
}
```
*(Email/password fields can be added later as optional fields without breaking this schema, if you ever want non-Google signup.)*

### 7.2 Property
```
Property {
  _id
  hostId              // ref User
  title, description
  images: string[]    // max 8, enforced in validation layer
  location: { address, suburb, city, province, lat, lng }  // geo-indexed for search
  stayRate: number     // ZAR per night
  minNights: number
  maxNights: number
  maxGuests, bedrooms, bathrooms, beds
  amenities: string[]
  propertyType: 'entire_place' | 'private_room' | 'shared_room'
  houseRules?: string
  checkInTime, checkOutTime
  isAvailable: boolean          // host-level on/off switch
  status: 'draft' | 'pending_review' | 'published' | 'suspended'  // admin moderation
  ratingAvg: number, ratingCount: number   // denormalized from Review
  createdAt, updatedAt
}
```
Note: `isAvailable` is a coarse on/off switch; actual date-level availability is derived by checking for overlapping confirmed Bookings against requested check-in/check-out dates — no separate calendar model needed for v1.

### 7.3 Booking
```
Booking {
  _id
  guestId, hostId, propertyId
  checkIn, checkOut          // dates, validated against property's min/maxNights and no overlap
  numGuests
  nightlyRate, totalNights, subtotal, adminFeeAmount, hostPayoutAmount, totalPrice
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  paymentRef?: string         // PayFast payment/transaction ID — never store card details
  bookingStatus: 'pending_payment' | 'confirmed' | 'cancelled_by_guest' | 'cancelled_by_host' | 'completed' | 'refunded'
  cancelledAt?, cancellationReason?
  reminderSentAt?, ratingPromptSentAt?   // set by worker jobs, prevents double-sends
  createdAt, updatedAt
}
```
Payment details (card numbers etc.) intentionally do **not** live here — PayFast's hosted checkout handles that (PCI scope stays off our servers); we only persist their transaction reference and status.

### 7.4 Payout
```
Payout {
  _id
  hostId, bookingId
  amount
  status: 'pending' | 'paid' | 'failed'
  method: 'manual_eft'        // see §3 risk #1 — PayFast has no automated payout API
  paidAt?, paidBy?            // admin who marked it paid
  notes?
  createdAt, updatedAt
}
```

### 7.5 Reviews
```
PropertyReview { bookingId, guestId, propertyId, rating, comment, createdAt }
HostReview     { bookingId, guestId, hostId, rating, comment, createdAt }   // guest rates host
GuestReview    { bookingId, hostId, guestId, rating, comment, createdAt }   // host rates guest
```
One of each per booking, enforced via a unique compound index on `bookingId`. Submission only allowed starting 24h after `checkOut` (enforced server-side, not just via the prompt timing).

---

## 8. Payment & Payout Flow

1. Guest confirms a booking request → `Booking` created with `bookingStatus: pending_payment`.
2. Guest is redirected to PayFast's hosted checkout for the total price.
3. PayFast sends a server-to-server **ITN webhook** on payment completion. The API validates the signature and performs PayFast's required server-side confirmation call before trusting it (never trust the browser redirect alone).
4. On confirmed payment: `paymentStatus: paid`, `bookingStatus: confirmed`, admin fee and host payout amount are computed and stored, confirmation emails queued (guest + host), and the 24h-before-checkin reminder + 24h-after-checkout rating-prompt jobs are scheduled in BullMQ.
5. Funds sit in the **platform's** PayFast/bank account (this is inherent to how PayFast works — there's no split-at-source like Stripe Connect).
6. Admin periodically reviews `Payout` records (auto-created alongside confirmed bookings) and manually EFTs hosts their `hostPayoutAmount`, marking the `Payout` as paid in the admin console (Slice 5). See §3 risk #1 for why this is manual rather than automated in v1.
7. Cancellations (Slice 7): if within the free-cancellation window, refund via PayFast (API or dashboard — see §3 risk #2) and set `bookingStatus: cancelled_by_guest/host`, `paymentStatus: refunded`.

---

## 9. Notifications

Handled entirely by the `worker` app via BullMQ queues, so the API never blocks on email sending.

Email/notification points:
- Welcome email on signup
- Booking requested (pending payment) — guest
- Payment confirmed / booking confirmed — guest & host
- **24h-before-check-in reminder** — guest (delayed job scheduled at booking confirmation time, target = `checkIn - 24h`)
- Cancellation confirmation / refund processed
- **24h-after-checkout rating prompt** — guest & host (delayed job scheduled at booking confirmation time, target = `checkOut + 24h`)
- Host payout sent notification
- Admin alerts: new host signup, listing pending review, dispute raised

All delayed jobs are idempotent — guarded by `reminderSentAt`/`ratingPromptSentAt` on the Booking so a worker restart can't double-send.

---

## 10. Roles & Permissions

| Capability | Guest | Host | Admin |
|---|---|---|---|
| Search/browse properties | ✅ (no login needed) | ✅ | ✅ |
| Create booking | ✅ (login required) | — | — |
| Create/edit own listing | — | ✅ | ✅ (any listing, moderation) |
| Suspend a listing | — | — | ✅ |
| Suspend a user | — | — | ✅ |
| Rate a property/host (post-stay) | ✅ | — | — |
| Rate a guest (post-stay) | — | ✅ | — |
| View/manage payouts | — | view own | manage all |
| Trigger refunds | — | — | ✅ |

A user's `roles` array can contain more than one of `guest`/`host`; `admin` is never self-assigned.

**Listing dashboards are separate per role, sharing one underlying form component:**
- **Host dashboard** (`pages/host/`) — "My Listings", scoped to the host's own `hostId`. Create/edit always sets `hostId` to the logged-in host; includes bookings/earnings views tied to their own properties.
- **Admin dashboard** (`pages/admin/`) — "All Listings" across every host, plus moderation actions (approve/reject/suspend). Admin create/edit is an on-behalf-of tool: the form requires picking an existing host account to attach the listing to — admins can never be a listing's `hostId` themselves (see §2).

---

## 11. Deployment & Ops

- `docker-compose.yml` on the VPS: `nginx` (TLS via certbot, reverse proxy) → `api`, `web` (static build), `worker`, `mongo`, `redis`.
- GitHub Actions CI: lint, typecheck, test on every push. Deploy step is a simple SSH + `docker compose pull && up -d` initially — no need for anything fancier at this scale.
- **Backups (must-do given the disk-storage decision in §2/§3):** scheduled cron on the VPS for (a) `mongodump` of the database and (b) an archive of the uploads directory, both shipped off-box (e.g. to an object storage bucket used *only* for backups, or synced elsewhere) — don't rely on the same disk that serves the app.
- Basic monitoring: uptime check (even a free external pinger) + error tracking (e.g. Sentry free tier) from day one — cheap insurance for a solo-maintained system.

---

## 12. Build Slices

Each slice should be shippable/demoable on its own.

- **Slice 0 — Foundation**: monorepo scaffold (npm/pnpm workspaces), TS config, ESLint/Prettier, `packages/shared`, Docker Compose skeleton (mongo + redis), CI skeleton, bare Express server + bare React app.
- **Slice 1 — Auth**: Google OAuth2 via Passport, `User` model with `roles`, JWT issuance/refresh, role-guard middleware, frontend login/logout + auth context + role-based route guards.
- **Slice 2 — Listings**: `Property` model, host create/edit endpoints, image upload (max 8, disk storage), public search/browse (no auth), property detail page.
- **Slice 3 — Booking requests**: `Booking` model, date-overlap availability check against `minNights`/`maxNights`, guest booking request flow (auth required), host/guest booking list views.
- **Slice 4 — Payments**: PayFast checkout integration, ITN webhook handling + validation, booking status transitions, admin fee computation.
- **Slice 5 — Payouts**: `Payout` model, admin dashboard for pending payouts, manual mark-as-paid flow, host payout history view.
- **Slice 6 — Notifications**: `worker` app stood up, BullMQ + transactional email provider wired in, all booking-stage emails, 24h reminder job.
- **Slice 7 — Cancellations & refunds**: cancellation endpoint enforcing the 24–48h rule, PayFast refund handling, status updates, notification emails.
- **Slice 8 — Ratings**: `PropertyReview`/`HostReview`/`GuestReview` models, 24h-post-checkout prompt job, submission endpoints, aggregate rating display.
- **Slice 9 — Admin console**: user management (suspend), listing moderation (approve/reject/suspend), dispute handling, basic revenue/admin-fee analytics.
- **Slice 10 — Hardening**: security pass (rate limiting, Helmet, input validation audit), automated backups live, monitoring/alerting live, deploy runbook written.

Later/optional: Slice 11 — guest/host messaging (explicitly deferred per §2).

---

## 13. Next Steps

1. Confirm the cancellation cutoff: 24h or 48h before check-in (§2 — defaulting to 48h unless you say otherwise).
2. Confirm a starting admin fee % (just a default — it's a runtime setting, not hardcoded).
3. Say the word and we start Slice 0.
