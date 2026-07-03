import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getStripeClient } from "../stripeClient";
import { db, businessesTable, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const getBaseUrl = (req: Request): string => {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
};

// GET /api/stripe/products — list active products with their prices
router.get("/stripe/products", async (req: Request, res: Response) => {
  try {
    const stripe = getStripeClient();
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 20 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);

    const enriched = products.data
      .filter((p) => p.name.startsWith("BurnCall"))
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        metadata: p.metadata,
        prices: prices.data
          .filter((pr) => pr.product === p.id)
          .map((pr) => ({
            id: pr.id,
            unit_amount: pr.unit_amount,
            currency: pr.currency,
            interval: (pr.recurring as { interval?: string } | null)?.interval ?? null,
            interval_count: (pr.recurring as { interval_count?: number } | null)?.interval_count ?? null,
          }))
          .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0)),
      }))
      .sort((a, b) => {
        const aMin = Math.min(...(a.prices.map((p) => p.unit_amount ?? Infinity)));
        const bMin = Math.min(...(b.prices.map((p) => p.unit_amount ?? Infinity)));
        return aMin - bMin;
      });

    res.json({ products: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// POST /api/stripe/checkout — create a Stripe Checkout session
// Requires auth: the checkout is tied to the authenticated business via
// session metadata, so the webhook handler can update the right row when
// the subscription is created.
router.post("/stripe/checkout", requireAuth, requireRole("owner"), async (req: Request, res: Response) => {
  const { priceId } = req.body as { priceId?: string };

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.auth!.userId) });

  try {
    const stripe = getStripeClient();
    const base = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(user?.email ? { customer_email: user.email } : {}),
      success_url: `${base}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${base}/billing?status=cancelled`,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: { businessId: String(req.auth!.businessId) },
      },
      metadata: { businessId: String(req.auth!.businessId) },
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// POST /api/stripe/portal — customer billing portal for the authenticated business
router.post("/stripe/portal", requireAuth, requireRole("owner"), async (req: Request, res: Response) => {
  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, req.auth!.businessId) });
  if (!business?.stripeCustomerId) {
    res.status(400).json({ error: "No billing account found yet — subscribe to a plan first." });
    return;
  }
  try {
    const stripe = getStripeClient();
    const base = getBaseUrl(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${base}/billing`,
    });
    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// GET /api/stripe/session/:id — retrieve checkout session
router.get("/stripe/session/:id", async (req: Request, res: Response) => {
  try {
    const stripe = getStripeClient();
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
    res.json({ session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

// POST /api/stripe/seed — create BurnCall plans if they don't exist (dev/admin only)
router.post("/stripe/seed", async (_req: Request, res: Response) => {
  const PLANS = [
    {
      name: "BurnCall Starter",
      description: "1 location · Up to 100 leads/month · AI lead response · Email notifications · Basic reporting",
      monthlyAmount: 14900,
      annualAmount: 143040,
      metadata: { plan: "starter" },
    },
    {
      name: "BurnCall Growth",
      description: "Up to 500 leads/month · SMS automation · Missed-call text back · Calendar booking · Team inbox",
      monthlyAmount: 29900,
      annualAmount: 287040,
      metadata: { plan: "growth" },
    },
    {
      name: "BurnCall Pro",
      description: "Multiple locations · Up to 2,000 leads/month · Custom AI playbooks · CRM integrations · Unlimited team members",
      monthlyAmount: 49900,
      annualAmount: 479040,
      metadata: { plan: "pro" },
    },
  ] as const;

  try {
    const stripe = getStripeClient();
    const results: Record<string, unknown>[] = [];

    for (const plan of PLANS) {
      const existing = await stripe.products.search({
        query: `name:'${plan.name}' AND active:'true'`,
      });

      let productId: string;
      if (existing.data.length > 0) {
        productId = existing.data[0].id;
        results.push({ name: plan.name, status: "already_exists", productId });
      } else {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: plan.metadata,
        });
        productId = product.id;
        results.push({ name: plan.name, status: "created", productId });
      }

      // Monthly price
      const allPrices = await stripe.prices.list({ product: productId, active: true });
      const hasMonthly = allPrices.data.some(
        (p) => p.recurring?.interval === "month" && p.unit_amount === plan.monthlyAmount,
      );
      if (!hasMonthly) {
        const mp = await stripe.prices.create({
          product: productId,
          unit_amount: plan.monthlyAmount,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: { billing: "monthly" },
        });
        results.push({ name: plan.name, type: "monthly_price", priceId: mp.id, amount: plan.monthlyAmount });
      }

      // Annual price
      const hasAnnual = allPrices.data.some(
        (p) => p.recurring?.interval === "year" && p.unit_amount === plan.annualAmount,
      );
      if (!hasAnnual) {
        const ap = await stripe.prices.create({
          product: productId,
          unit_amount: plan.annualAmount,
          currency: "usd",
          recurring: { interval: "year" },
          metadata: { billing: "annual", discount: "20%" },
        });
        results.push({ name: plan.name, type: "annual_price", priceId: ap.id, amount: plan.annualAmount });
      }
    }

    res.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

export default router;
