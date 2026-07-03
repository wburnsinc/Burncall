# BurnCall — Integrations & Secrets Reference

## 1. PostgreSQL Database

| Field | Value |
|---|---|
| **Purpose** | Primary data store for users, businesses, leads, appointments, conversations, automations |
| **Env var** | `DATABASE_URL` |
| **Provider (current)** | Replit-managed PostgreSQL (auto-provisioned) |
| **How to obtain** | On Replit: enable Database in the project tools panel. Elsewhere: provision any PostgreSQL ≥14 instance |
| **Schema location** | `lib/db/src/schema/` (Drizzle ORM) |
| **Migration command** | `pnpm --filter @workspace/db run push` |
| **After migration** | Verify with `pnpm --filter @workspace/db run push --dry-run` |
| **Rotation** | Update `DATABASE_URL` and restart the API server |

---

## 2. Stripe

| Field | Value |
|---|---|
| **Purpose** | Subscription billing (Starter $149/mo · Growth $299/mo · Pro $499/mo), Stripe-hosted Checkout, Customer Portal |
| **Env vars** | `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Dashboard** | https://dashboard.stripe.com |
| **How to obtain keys** | Stripe Dashboard → Developers → API keys |
| **Webhook endpoint** | `https://<your-domain>/api/stripe/webhook` |
| **Webhook events needed** | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed` |
| **Register webhook** | Stripe Dashboard → Developers → Webhooks → Add endpoint → paste URL → copy `whsec_…` into `STRIPE_WEBHOOK_SECRET` |
| **Products** | Run `pnpm --filter @workspace/scripts run seed-stripe` after setting `STRIPE_SECRET_KEY` — idempotent, safe to re-run |
| **Test keys** | Use `pk_test_` / `sk_test_` keys from the Stripe Dashboard for non-production environments |
| **Rotation** | Replace env vars and restart the API server; re-register the webhook if the domain changes |

### Live Stripe products created (as of build)
| Product | Monthly price ID | Annual price ID |
|---|---|---|
| BurnCall Starter ($149/mo) | `price_1TmEJZ5NR2JsfJFCCKpIj0HA` | `price_1TmEJZ5NR2JsfJFCRiBWZZkt` |
| BurnCall Growth ($299/mo) | `price_1TmEJa5NR2JsfJFCwQJ8GIrP` | `price_1TmEJa5NR2JsfJFCAIRM1Dj3` |
| BurnCall Pro ($499/mo) | `price_1TmEJa5NR2JsfJFC3rldnrRj` | `price_1TmEJa5NR2JsfJFC5fpFPKdO` |

> **Note:** These price IDs are tied to the live Stripe account used during development.  
> If you use a different Stripe account or test mode, run `seed-stripe` to recreate them.

---

## 3. Session Secret

| Field | Value |
|---|---|
| **Purpose** | Signs HTTP session cookies on the API server |
| **Env var** | `SESSION_SECRET` |
| **How to generate** | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **Rotation** | Changing this invalidates all active sessions (users get logged out) |

---

## 4. Replit Platform Variables (auto-injected)

| Variable | Purpose | Manual equivalent |
|---|---|---|
| `REPLIT_DOMAINS` | Comma-separated public domains; used to build Stripe redirect URLs | Set to your production domain, e.g. `burncall.co` |
| `PORT` | Port each workflow service binds to | Set to `8080` for the API server |

---

## 5. External Services — None Currently Required

The following categories are **not yet integrated** but will be needed for production operation:

| Category | Recommended service | Why needed |
|---|---|---|
| Transactional email | SendGrid / Postmark / Resend | Magic-link login, lead notifications, booking confirmations |
| SMS / Voice | Twilio | Missed-call text back, SMS automation |
| AI responses | OpenAI / Anthropic | AI lead qualification and response generation |
| Analytics | PostHog / Mixpanel | Product analytics |
| Error tracking | Sentry | Runtime error monitoring |
| Custom domain DNS | Cloudflare / Namecheap | Point `burncall.co` to your host |

> Each service above will need its own API key added to `.env` and wired into the relevant API route.

---

## 6. Credential Checklist for Migration

- [ ] Copy `DATABASE_URL` from new PostgreSQL instance
- [ ] Copy `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` from Stripe Dashboard
- [ ] Register webhook at new domain → copy `STRIPE_WEBHOOK_SECRET`
- [ ] Generate new `SESSION_SECRET`
- [ ] Set `REPLIT_DOMAINS` (or equivalent) to new public domain
- [ ] Run `pnpm --filter @workspace/scripts run seed-stripe` to recreate Stripe products
- [ ] Run `pnpm --filter @workspace/db run push` to apply DB schema
