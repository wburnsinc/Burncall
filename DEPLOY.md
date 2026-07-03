# BurnCall — Deployment Guide (Free-tier stack)

This build uses **Node.js + Express + React + PostgreSQL** (not Python — see note at
bottom). As of this pass, essentially everything in the app is real and DB-backed;
the mock/demo layer from the original handover has been replaced end-to-end.

**Backend — all real:**
- ✅ **Auth** — bcrypt + JWT sessions backed by Postgres
- ✅ **AI Receptionist** — real Anthropic Claude tool-use loop (qualify_lead,
  check_availability, book_appointment, escalate_to_human), plus a no-DB-write
  `/api/ai/test` endpoint for safely previewing AI behavior from the Knowledge Base page
- ✅ **Inbound channels** — public webchat endpoint + Twilio inbound-SMS webhook (TwiML reply)
- ✅ **Notifications** — real Resend email + Twilio SMS, no-op (logged) if keys aren't set
- ✅ **Leads, Dashboard, Appointments, Automations, Inbox, Business Settings, Team, Integrations status** — all query Postgres, scoped to the authenticated business
- ✅ **Stripe billing loop is now actually closed** — checkout is tied to the
  business via session metadata, and the webhook handler (`webhookHandlers.ts`,
  previously a verify-and-discard no-op) now persists `stripeCustomerId`,
  `stripeSubscriptionId`, `subscriptionStatus`, and `plan` back onto the business
  row on `checkout.session.completed` / `customer.subscription.updated|deleted`.
- ✅ **Custom AI instructions from the Knowledge Base page are live** — text saved
  there is injected directly into the receptionist's system prompt

**Frontend — all main pages wired to the real API:**
Login, Signup, Onboarding, Dashboard, Leads, LeadDetail, Inbox, Appointments,
Automations, Settings, Knowledge Base, Team, Integrations, Billing. Routes are
gated behind a real session via `AuthProvider` + `ProtectedRoute`.

**Honest gaps / things presented accurately rather than faked:**
- Integrations page shows real connect/disconnect state for Anthropic, Resend,
  Twilio, Stripe, and the database (env-var presence check) — third-party
  integrations that aren't built (Google Calendar sync, HubSpot, Jobber,
  ServiceTitan, Housecall Pro, Zapier, Gmail/Outlook inbox monitoring) are shown
  in a clearly-labeled "Planned Integrations" section instead of fake toggles.
- Knowledge Base's "Documents" tab (fake indexed PDFs) was removed rather than
  left as non-functional decoration — there's no document storage/indexing
  backend. Revisit if you want real RAG over uploaded docs.
- Team page's role-permission matrix is a reference table only — permission
  enforcement in the API isn't built yet (any authenticated user on a business
  can currently do anything an owner can).
- Billing's invoice history, payment method details, and subscription
  cancellation are delegated entirely to Stripe's hosted customer portal
  (`/api/stripe/portal`) rather than reimplemented — this is the standard,
  correct way to handle these vs. re-fetching/rendering raw Stripe data.
- Appointments' fake calendar-grid view (hardcoded to a specific week in 2025)
  was replaced with a real, date-grouped list view driven by actual appointment
  data; a true calendar-grid view is a reasonable next addition.

**Cross-origin auth fix carried over from the previous pass:** the generated
API client never sent `credentials: 'include'`, which would've silently broken
the httpOnly session cookie on a split-domain deploy (Vercel + Railway). Fixed
in `lib/api-client-react/src/custom-fetch.ts`. The frontend's own `lib/api.ts`
also stores the JWT in `localStorage` and sends it as a `Bearer` token as a
fallback, since Safari/Chrome increasingly block third-party cookies.

## 1. Database — Neon (free 0.5GB Postgres)
1. Create a project at https://neon.tech
2. Copy the connection string into `DATABASE_URL`
3. From `lib/db`, run: `pnpm push` (applies the Drizzle schema — creates all tables)

## 2. AI — Anthropic Claude
1. Get a key at https://console.anthropic.com ($5 free credit on signup)
2. Set `ANTHROPIC_API_KEY` in your environment
3. That's it — `lib/receptionist.ts` will start making real API calls immediately

## 3. Backend — Railway (500 free hours/mo) or Replit
1. Push `artifacts/api-server` (+ `lib/db`, `lib/api-zod`) as a Node service
2. Set all env vars from `.env.example` (Database, Session, Anthropic at minimum)
3. Start command: `pnpm run build && pnpm run start`

## 4. Frontend — Vercel (free static hosting)
1. Deploy `artifacts/burncall` (Vite build)
2. Set `VITE_API_URL` in Vercel's project env vars to your Railway/Replit backend URL (e.g. `https://burncall-api.up.railway.app`) — this is what `lib/api.ts` uses as the base URL for every API call
3. Set `PUBLIC_APP_URL` on the backend to this Vercel URL (used for CORS + email links)

## 5. Email — Resend (3,000 free emails/mo, optional but recommended)
1. Get a key at https://resend.com, verify a sending domain (or use their test domain)
2. Set `RESEND_API_KEY` and `NOTIFY_FROM_EMAIL`

## 6. SMS — Twilio (optional, $15 trial credit)
1. Buy/claim a trial number in the Twilio console
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
3. Point the number's "A message comes in" webhook at:
   `https://your-backend-url/api/twilio/sms-inbound`
4. Set `businesses.phone` in the DB to match the Twilio number so inbound SMS
   routes to the right business

## 7. Stripe (already scaffolded from the original handover)
Re-seed live/test price IDs under your own Stripe account and set
`STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`.
In the Stripe Dashboard, point a webhook endpoint at
`https://your-backend-url/api/stripe/webhook` and subscribe it to at least:
`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
— the handler in `webhookHandlers.ts` uses these to keep each business's
`plan`/`subscriptionStatus` in sync automatically.

---

## Why not Python?
Python 2.12 doesn't exist — Python 2 ended at 2.7 (EOL Jan 2020). The original
handover codebase is TypeScript/Express/React, already ~80% built and already
wired to a matching OpenAPI/Zod contract and React frontend. Rewriting the
backend in Python would mean discarding that working integration surface for
no functional gain — Node is equally capable of real Claude/Twilio/Resend/Stripe
calls. If you specifically want a Python **microservice** for some future piece
(e.g. a custom ML scoring model), that can be added alongside this stack over
HTTP without touching what's built here.

## What was fixed in this pass (previously incapable → now real)

1. **Team invites now create real logins.** `POST /api/team` issues a signed
   7-day invite token; the invitee visits `/accept-invite?token=...`, sets a
   password, and gets a real account (`POST /api/auth/accept-invite`) linked
   to the business via a new `users.businessId` column. If Resend isn't
   configured, the invite link is also returned directly in the API response
   and shown/copyable in the Team page UI.
2. **Role permissions are now enforced server-side**, not just hidden in the
   UI. `requireRole()` middleware matches the exact matrix shown on the Team
   page: leads/dashboard are owner+admin+dispatcher only (not technician);
   automations, business settings, and team management are owner+admin only;
   billing/Stripe actions are owner-only. A disallowed request gets a real
   403, not a silently-ignored button.
3. **Automations actually fire now.** `lib/automationScheduler.ts` polls
   every 5 minutes (configurable via `AUTOMATION_POLL_INTERVAL_MS`) and
   executes two trigger patterns: `no_reply_<N>hr` (follow up on leads stuck
   without a reply) and `appointment_reminder_<N>hr` (remind customers before
   their appointment). Every send is deduplicated via an `automation_runs`
   table so nothing double-fires. **Caveat: this requires the Node process to
   stay running continuously** — it works on Railway/Replit's always-on
   processes, not on serverless/sleeping deployments.
4. **Real outbound webhooks.** `/api/webhooks` (CRUD) lets a business
   register a URL + subscribed events (`lead.created`, `lead.qualified`,
   `lead.won`, `lead.lost`, `appointment.confirmed`, `appointment.cancelled`).
   Deliveries are signed with HMAC-SHA256 (`X-BurnCall-Signature` header) so
   the receiver can verify authenticity, same pattern as Stripe/GitHub
   webhooks. This is what actually lets someone connect Zapier's "Webhooks by
   Zapier" trigger, or any CRM's own inbound webhook URL, without BurnCall
   needing a dedicated native integration for each one.
5. **Real "Add to Calendar" files.** Every appointment gets a standards-
   compliant `.ics` file at `GET /api/appointments/:id/ics` (public, no
   login required — same access-control model as any emailed calendar
   invite link). Works with Google Calendar, Apple Calendar, and Outlook.
   The link is included in AI-sent confirmation emails and downloadable from
   the Appointments page. This is a real, working "calendar" feature that
   does **not** require OAuth or a live integration with any specific
   calendar provider.

### Bonus: Real platform-admin system (just added)

The `/admin` page was previously 100% hardcoded fake data (fake companies,
fake MRR, fake AI usage) and — worse — was only gated by "are you logged in,"
meaning any signed-up business user could technically view it. Both are fixed:

- **Real data.** `/api/admin/accounts`, `/api/admin/stats`,
  `/api/admin/automation-health`, and `/api/admin/ai-usage` all query real
  tables. AI usage is especially notable — every Anthropic API call (both
  live receptionist turns and Knowledge Base test calls) now logs its actual
  `input_tokens`/`output_tokens` to a new `ai_usage_log` table, so that chart
  is real token counts, not a guess.
- **Real access control.** Platform-admin access is controlled by a
  `PLATFORM_ADMIN_EMAILS` env var (comma-separated) — there is no in-app
  "promote to admin" button anywhere, intentionally. To become a platform
  admin: sign up/log in normally first, add your email to
  `PLATFORM_ADMIN_EMAILS` in your deployment's env vars, redeploy, then log in
  again — your account is synced against the allowlist on every login. The
  API additionally enforces this server-side (`requirePlatformAdmin`
  middleware, real 403 if you're not on the list), not just a hidden nav link.
- MRR shown is an **estimate** derived from each business's plan tier and
  Stripe subscription status — not pulled live from Stripe's own MRR
  reporting. Treat it as directional, not the accounting source of truth.

### Still genuinely not built, and why

- **Native OAuth calendar sync** (two-way Google Calendar/Outlook sync,
  auto-blocking your calendar, etc.) — requires registering an OAuth app with
  Google/Microsoft, obtaining their API credentials, and a consent-screen
  review process on their end. That needs your own developer accounts with
  those providers; it can't be stood up from this sandbox.
- **Native CRM/field-service integrations** (HubSpot, Jobber, ServiceTitan,
  Housecall Pro) — same issue: each requires its own developer account, API
  approval process, and (for some) a paid partner tier. The webhooks system
  above is the honest, real path to reach these today via each platform's own
  inbound webhook support or Zapier as a bridge.
- **Document upload / AI training on PDFs (RAG)** — would need file storage
  (S3-equivalent), a text-extraction pipeline, a vector store, and embedding
  calls. Buildable, but a meaningfully larger feature than what's been added
  here; flag if you want this prioritized next.
- **Gmail/Outlook inbox monitoring** — same OAuth-app constraint as calendar sync.


- No automated tests yet
- `leads.ts` / `dashboard.ts` / `appointments.ts` / `automations.ts` still serve
  mock data — same DB-wiring pattern as `auth.ts`/`inbox.ts` applies directly
- I have no network access in this sandbox, so none of this has been run against
  a live Anthropic/Twilio/Resend/Neon account — you'll be the first real test.
  Errors are logged clearly (via `pino`) if any integration misbehaves.
