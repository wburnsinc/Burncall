# BurnCall — Relaunch Guide

Complete step-by-step instructions to import, configure, run, and deploy BurnCall on a new account, host, or machine.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 24+ | https://nodejs.org or `nvm install 24` |
| pnpm | 10+ | `npm install -g pnpm@10` |
| PostgreSQL | 14+ | https://postgresql.org or managed (Neon, Supabase, Railway) |

---

## Step 1 — Import Source Code

### Option A: Replit (recommended)

1. Log in to your Replit account
2. Click **+ Create Repl** → **Import from ZIP**
3. Upload `burncall-handover.zip`
4. Replit will detect the pnpm workspace automatically

### Option B: Local / VPS

```bash
unzip burncall-handover.zip -d burncall
cd burncall
```

---

## Step 2 — Install Dependencies

```bash
pnpm install
```

This installs all packages across every workspace (frontend, API server, shared libs, scripts).

---

## Step 3 — Create the Database

### On Replit
1. Open the project Tools panel → enable **Database**
2. Replit auto-sets `DATABASE_URL`

### Elsewhere (Neon example)
```bash
# 1. Create a new Neon project at https://neon.tech
# 2. Copy the connection string, then:
export DATABASE_URL="postgresql://user:password@host/burncall?sslmode=require"
```

---

## Step 4 — Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in every value. See `INTEGRATIONS_AND_SECRETS.md` for where to obtain each one.

Minimum required for the app to start:
```
DATABASE_URL=...
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
SESSION_SECRET=...
PORT=8080
```

### On Replit
Use the **Secrets** panel (lock icon in the sidebar) instead of a `.env` file. Add each key/value pair there.

---

## Step 5 — Apply Database Schema

```bash
pnpm --filter @workspace/db run push
```

This runs Drizzle ORM migrations and creates all tables:
- `users`, `businesses`, `leads`, `appointments`, `conversations`, `automations`

Verify:
```bash
# Connect to your DB and run:
\dt
# Should list all 6 tables
```

---

## Step 6 — Seed Stripe Products

Run once to create the three subscription plans in Stripe:

```bash
STRIPE_SECRET_KEY=sk_live_... pnpm --filter @workspace/scripts run seed-stripe
```

On Replit (where the secret is already set):
```bash
pnpm --filter @workspace/scripts run seed-stripe
```

This is **idempotent** — safe to run multiple times. It skips products that already exist.

Expected output:
```
✓ Created product: BurnCall Starter
  + Monthly price: $149.00/mo
  + Annual price: $1,430.40/yr
✓ Created product: BurnCall Growth
  + Monthly price: $299.00/mo
  + Annual price: $2,870.40/yr
✓ Created product: BurnCall Pro
  + Monthly price: $499.00/mo
  + Annual price: $4,790.40/yr
All BurnCall plans seeded successfully.
```

---

## Step 7 — Register the Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Set URL to: `https://<your-domain>/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Copy the **Signing secret** (`whsec_…`)
6. Add it to your env as `STRIPE_WEBHOOK_SECRET`

---

## Step 8 — Run Locally / In Preview

### On Replit
Start workflows from the **Run** button or via the Workflows panel:
- **API Server** → runs `pnpm --filter @workspace/api-server run dev` on port `PORT`
- **BurnCall web** → runs `pnpm --filter @workspace/burncall run dev`

### Locally

Terminal 1 — API server:
```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

Terminal 2 — Frontend:
```bash
pnpm --filter @workspace/burncall run dev
```

Frontend will be at http://localhost:5173 (or whichever port Vite assigns).  
API will be at http://localhost:8080.

> The frontend proxies `/api` requests to the API server. If running locally without Replit's shared proxy, configure `VITE_API_URL` or add a Vite proxy in `vite.config.ts`.

---

## Step 9 — Deploy to Production

### On Replit
1. Click **Deploy** in the top bar
2. Choose **Autoscale** or **Reserved VM**
3. Set all secrets in the Deployment Secrets panel
4. Replit provisions HTTPS and a `.replit.app` domain automatically

### On a VPS / Cloud host (Fly.io, Railway, Render)

Build:
```bash
pnpm --filter @workspace/api-server run build  # outputs dist/index.mjs
pnpm --filter @workspace/burncall run build    # outputs dist/
```

Serve the frontend `dist/` via a CDN or static host (Vercel, Cloudflare Pages, Netlify).  
Run the API server: `node --enable-source-maps artifacts/api-server/dist/index.mjs`

---

## Step 10 — Connect a Custom Domain

### On Replit
1. Deployments → Custom domain → enter `burncall.co` (or your domain)
2. Add a CNAME record at your DNS provider pointing to the Replit deployment URL

### DNS record template
```
Type    Host    Value
CNAME   @       your-app.replit.app
CNAME   www     your-app.replit.app
```

Wait for DNS propagation (up to 48 hours). Replit auto-provisions TLS.

---

## Step 11 — Smoke Test Before Going Live

Run through this checklist:

- [ ] `GET /api/healthz` returns `200 OK`
- [ ] Marketing home page loads at `/`
- [ ] `/pricing` shows all three plan cards
- [ ] `/signup` form submits without error
- [ ] `/login` magic-link flow completes
- [ ] `/dashboard` loads with summary stats
- [ ] `/leads` table renders and filters work
- [ ] `/billing` loads Stripe plans from live API
- [ ] Clicking "Subscribe via Stripe" redirects to real Stripe Checkout
- [ ] Stripe test card `4242 4242 4242 4242` completes a checkout
- [ ] Success redirect returns to `/billing?status=success`
- [ ] Stripe webhook endpoint receives the `checkout.session.completed` event (check Stripe Dashboard → Webhooks → recent deliveries)

---

## Step 12 — Backup & Restore

### Database backup (PostgreSQL)
```bash
# Backup
pg_dump $DATABASE_URL > burncall-backup-$(date +%Y%m%d).sql

# Restore to new DB
psql $NEW_DATABASE_URL < burncall-backup-YYYYMMDD.sql
```

### Full project backup
```bash
# Zip source (no node_modules)
zip -r burncall-src-$(date +%Y%m%d).zip . \
  --exclude "*/node_modules/*" \
  --exclude "*/.git/*" \
  --exclude "*/dist/*" \
  --exclude "*/.cache/*"
```

### Stripe data
- Stripe stores all subscription, customer, payment, and invoice data server-side
- No manual backup needed — data persists in Stripe's dashboard regardless of your server state
- Export from Stripe Dashboard → Data → Exports if needed for accounting

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `PORT env variable required` | Ensure `PORT=8080` is set |
| `STRIPE_SECRET_KEY env var required` | Add key to Secrets / .env |
| `DATABASE_URL not set` | Add connection string; ensure DB is reachable |
| Stripe plans show "Coming Soon" | Run `seed-stripe` script; check Stripe Dashboard for products |
| Webhook returns 400 | Ensure `STRIPE_WEBHOOK_SECRET` is set and route is registered before express.json() |
| Blank preview page | Check that both workflows (API server + web) are running |
