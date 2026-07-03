# BurnCall — Handover Verification Checklist

This document confirms the completeness of the handover package and lists every item a new owner needs to relaunch BurnCall independently.

---

## 1. Source Code Coverage

### Frontend (`artifacts/burncall/`)
| Page / Route | File | Status |
|---|---|---|
| Home (marketing) | `src/pages/Home.tsx` | ✅ Included |
| About | `src/pages/About.tsx` | ✅ Included |
| Pricing | `src/pages/Pricing.tsx` | ✅ Included |
| Demo | `src/pages/Demo.tsx` | ✅ Included |
| How It Works | `src/pages/HowItWorks.tsx` | ✅ Included |
| Industries | `src/pages/Industries.tsx` | ✅ Included |
| Signup | `src/pages/Signup.tsx` | ✅ Included |
| Login | `src/pages/Login.tsx` | ✅ Included |
| Onboarding (5-step wizard) | `src/pages/Onboarding.tsx` | ✅ Included |
| Privacy Policy | `src/pages/Privacy.tsx` | ✅ Included |
| Terms of Service | `src/pages/Terms.tsx` | ✅ Included |
| Dashboard | `src/pages/Dashboard.tsx` | ✅ Included |
| Leads | `src/pages/Leads.tsx` | ✅ Included |
| Lead Detail | `src/pages/LeadDetail.tsx` | ✅ Included |
| Inbox | `src/pages/Inbox.tsx` | ✅ Included |
| Appointments / Calendar | `src/pages/Appointments.tsx` | ✅ Included |
| Automations | `src/pages/Automations.tsx` | ✅ Included |
| Knowledge Base | `src/pages/KnowledgeBase.tsx` | ✅ Included |
| Integrations | `src/pages/Integrations.tsx` | ✅ Included |
| Team | `src/pages/Team.tsx` | ✅ Included |
| Settings | `src/pages/Settings.tsx` | ✅ Included |
| Billing | `src/pages/Billing.tsx` | ✅ Included |
| Admin | `src/pages/Admin.tsx` | ✅ Included |

### Backend (`artifacts/api-server/src/`)
| Route module | Endpoints | Status |
|---|---|---|
| `routes/health.ts` | `GET /api/healthz` | ✅ Included |
| `routes/auth.ts` | signup, login, logout, magic-link, me | ✅ Included |
| `routes/leads.ts` | CRUD + filter/search/paginate | ✅ Included |
| `routes/dashboard.ts` | stats + charts | ✅ Included |
| `routes/appointments.ts` | CRUD | ✅ Included |
| `routes/automations.ts` | CRUD + toggle | ✅ Included |
| `routes/inbox.ts` | conversations + takeover + reply | ✅ Included |
| `routes/stripe.ts` | products, checkout, portal, session, seed | ✅ Included |
| `webhookHandlers.ts` | Stripe webhook verification | ✅ Included |
| `stripeClient.ts` | Stripe SDK init from env | ✅ Included |

### Shared Libraries
| Package | Purpose | Status |
|---|---|---|
| `lib/db` | Drizzle ORM + schema | ✅ Included |
| `lib/api-spec` | OpenAPI YAML | ✅ Included |
| `lib/api-zod` | Generated Zod schemas | ✅ Included |
| `lib/api-client-react` | Generated React Query hooks | ✅ Included |

### Scripts
| Script | Purpose | Status |
|---|---|---|
| `scripts/src/seed-products.ts` | Create Stripe subscription plans | ✅ Included |

### Config & Build Files
| File | Status |
|---|---|
| `pnpm-workspace.yaml` | ✅ Included |
| `package.json` (root) | ✅ Included |
| `pnpm-lock.yaml` | ✅ Included |
| `tsconfig.base.json` | ✅ Included |
| `tsconfig.json` (root) | ✅ Included |
| `artifacts/*/vite.config.ts` | ✅ Included |
| `artifacts/*/tsconfig.json` | ✅ Included |
| `artifacts/api-server/build.mjs` | ✅ Included |
| `.env.example` | ✅ Included |
| `.gitignore` | ✅ Included |

### Assets
| Asset | Location | Status |
|---|---|---|
| BurnCall logo (PNG) | `attached_assets/bestlogo_1782311057091.png` | ✅ Included |
| Brand image | `attached_assets/bestburnscallnogy_1782311057090.png` | ✅ Included |
| Product spec DOCX | `attached_assets/AI_LEAD_SITE_1782310962604.docx` | ✅ Included |

---

## 2. Data Sources Identified

| Data source | Purpose | Export method | Notes |
|---|---|---|---|
| PostgreSQL (Replit-managed) | Users, leads, appointments, conversations, automations | `pg_dump $DATABASE_URL > backup.sql` | **Must be exported manually** — see below |
| Stripe | Subscriptions, customers, invoices, payments | Stripe Dashboard → Data → Exports | Stripe retains all data server-side |

### ⚠️ Items Requiring Manual Export

**PostgreSQL data**: The database is managed by Replit and contains runtime data. To export before migration:
```bash
pg_dump $DATABASE_URL > burncall-data-export.sql
```
This is not included in the ZIP (database contents are runtime data, not source code).

**Stripe customer/subscription data**: All payment history lives in Stripe's servers under your Stripe account. No action needed — it stays there and is accessible from any new deployment using the same Stripe API keys.

---

## 3. Secrets & Environment Variables

| Variable | Required | Included in ZIP |
|---|---|---|
| `DATABASE_URL` | Yes | `.env.example` placeholder only ✅ |
| `STRIPE_SECRET_KEY` | Yes | `.env.example` placeholder only ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Yes | `.env.example` placeholder only ✅ |
| `STRIPE_WEBHOOK_SECRET` | Yes (production) | `.env.example` placeholder only ✅ |
| `SESSION_SECRET` | Yes | `.env.example` placeholder only ✅ |
| `PORT` | Yes | `.env.example` placeholder only ✅ |
| `REPLIT_DOMAINS` | Replit only | `.env.example` placeholder only ✅ |

> **No real secrets are included in the ZIP.** All values are placeholders.

---

## 4. Integrations Documented

| Integration | Documented |
|---|---|
| PostgreSQL | ✅ `INTEGRATIONS_AND_SECRETS.md` |
| Stripe (billing) | ✅ `INTEGRATIONS_AND_SECRETS.md` |
| Stripe Webhooks | ✅ `INTEGRATIONS_AND_SECRETS.md` |
| Session auth | ✅ `INTEGRATIONS_AND_SECRETS.md` |
| Planned: Email (SendGrid) | ✅ noted as not yet integrated |
| Planned: SMS (Twilio) | ✅ noted as not yet integrated |
| Planned: AI (OpenAI) | ✅ noted as not yet integrated |

---

## 5. Known Limitations & Manual Steps

| Item | Status | Action required |
|---|---|---|
| Live Stripe price IDs from current account | Linked to original Stripe account | Run `seed-stripe` in new account |
| Stripe webhook secret | Not in ZIP | Register webhook at new domain, copy `whsec_` |
| PostgreSQL data | Not in ZIP | Run `pg_dump` before decommissioning old environment |
| Real email sending | Not implemented | Wire SendGrid / Resend and add `EMAIL_API_KEY` |
| Real SMS / missed-call text back | Not implemented | Wire Twilio and add `TWILIO_*` keys |
| Real AI lead response | Not implemented | Wire OpenAI/Anthropic and add `OPENAI_API_KEY` |
| User authentication | Currently mock/demo | Implement full session storage linked to DB users table |
| `.replit` and workflow TOML files | Replit-specific | On non-Replit hosts, use the npm scripts directly (see `RELAUNCH_GUIDE.md`) |

---

## 6. Final Verification — Can the App Be Relaunched?

- [x] All source code is in the ZIP
- [x] All dependencies declared with exact versions in `pnpm-lock.yaml`
- [x] Database schema in `lib/db/src/schema/` with Drizzle migration command documented
- [x] Stripe product seed script included and documented
- [x] All secrets listed by name in `.env.example` — no real values included
- [x] All integrations documented in `INTEGRATIONS_AND_SECRETS.md`
- [x] Step-by-step relaunch in `RELAUNCH_GUIDE.md`
- [x] This checklist (`HANDOVER_CHECKLIST.md`) is included
- [x] Database export method documented (requires manual `pg_dump` by current owner)
- [x] New owner can relaunch **without** depending on this Replit workspace

---

## 7. Files Created for This Handover Package

| File | Purpose |
|---|---|
| `burncall-handover.zip` | Complete project archive (no node_modules, no secrets) |
| `.env.example` | All required env vars with safe placeholders |
| `INTEGRATIONS_AND_SECRETS.md` | Every external service, credential, and reconnection steps |
| `RELAUNCH_GUIDE.md` | Full step-by-step relaunch instructions |
| `HANDOVER_CHECKLIST.md` | This file — verification report |

---

*Handover package prepared: June 25, 2026*
