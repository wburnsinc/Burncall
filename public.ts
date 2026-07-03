import { Router, type IRouter, type Request, type Response } from "express";
import { eq, gte, sql } from "drizzle-orm";
import { db, businessesTable, usersTable, leadsTable, automationsTable, aiUsageLogTable } from "@workspace/db";
import { requireAuth, requirePlatformAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth, requirePlatformAdmin);

// Real monthly pricing per plan — same figures shown on the Billing page's
// fallback plan cards. Used only to compute aggregate MRR estimates; actual
// per-business billing truth still lives in Stripe.
const PLAN_PRICE: Record<string, number> = { starter: 149, growth: 299, pro: 499 };

// GET /api/admin/accounts — every business on the platform, real data
router.get("/admin/accounts", async (_req: Request, res: Response) => {
  const businesses = await db.select().from(businessesTable);

  const accounts = await Promise.all(
    businesses.map(async (biz) => {
      const owner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, biz.ownerId) });
      const leadCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(eq(leadsTable.businessId, biz.id));
      const isPaying = biz.subscriptionStatus === "active" || biz.subscriptionStatus === "trialing";
      return {
        id: biz.id,
        name: biz.name || "(unnamed business)",
        email: owner?.email || "—",
        industry: biz.industry || "—",
        plan: biz.plan,
        status: biz.subscriptionStatus === "canceled" ? "Churned" : biz.subscriptionStatus === "trialing" ? "Trial" : isPaying ? "Active" : "No Subscription",
        leads: leadCountResult[0]?.count ?? 0,
        mrr: isPaying ? PLAN_PRICE[biz.plan] ?? 0 : 0,
        joined: biz.createdAt,
      };
    }),
  );

  res.json({ accounts, total: accounts.length });
});

// GET /api/admin/stats — platform-wide aggregate metrics
router.get("/admin/stats", async (_req: Request, res: Response) => {
  const businesses = await db.select().from(businessesTable);
  const totalLeadsResult = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable);

  const payingBusinesses = businesses.filter((b) => b.subscriptionStatus === "active" || b.subscriptionStatus === "trialing");
  const mrr = payingBusinesses.reduce((sum, b) => sum + (PLAN_PRICE[b.plan] ?? 0), 0);

  // Real MRR trend by signup month (approximation: counts businesses that
  // were already paying, grouped by the month they joined — not a true
  // historical ledger, since we don't retain past subscription snapshots).
  const monthly = new Map<string, number>();
  for (const b of payingBusinesses) {
    const key = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthly.set(key, (monthly.get(key) ?? 0) + (PLAN_PRICE[b.plan] ?? 0));
  }

  res.json({
    totalAccounts: businesses.length,
    activeAccounts: payingBusinesses.length,
    trialAccounts: businesses.filter((b) => b.subscriptionStatus === "trialing").length,
    churnedAccounts: businesses.filter((b) => b.subscriptionStatus === "canceled").length,
    mrr,
    totalLeads: totalLeadsResult[0]?.count ?? 0,
    mrrByJoinMonth: Array.from(monthly.entries()).map(([month, value]) => ({ month, mrr: value })),
  });
});

// GET /api/admin/automation-health — real aggregate automation performance across every business
router.get("/admin/automation-health", async (_req: Request, res: Response) => {
  const automations = await db.select().from(automationsTable);
  const byName = new Map<string, { triggered: number; success: number; failures: number }>();

  for (const a of automations) {
    const stats = a.stats ?? { triggered: 0, sent: 0, failed: 0, opened: 0 };
    const existing = byName.get(a.name) ?? { triggered: 0, success: 0, failures: 0 };
    existing.triggered += stats.triggered;
    existing.success += stats.sent;
    existing.failures += stats.failed;
    byName.set(a.name, existing);
  }

  const health = Array.from(byName.entries()).map(([name, s]) => ({
    name,
    triggers: s.triggered,
    success: s.success,
    failures: s.failures,
    rate: s.triggered > 0 ? Math.round((s.success / s.triggered) * 1000) / 10 : 0,
  }));

  res.json({ automationHealth: health });
});

// GET /api/admin/ai-usage — real token usage from actual Anthropic API calls, last 7 days
router.get("/admin/ai-usage", async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db.select().from(aiUsageLogTable).where(gte(aiUsageLogTable.createdAt, since));

  const byDay = new Map<string, { tokens: number; calls: number }>();
  for (const r of rows) {
    const key = new Date(r.createdAt).toLocaleDateString("en-US", { weekday: "short" });
    const existing = byDay.get(key) ?? { tokens: 0, calls: 0 };
    existing.tokens += r.inputTokens + r.outputTokens;
    existing.calls += 1;
    byDay.set(key, existing);
  }

  res.json({
    usage: Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v })),
    totalCalls: rows.length,
    totalTokens: rows.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0),
  });
});

export default router;
