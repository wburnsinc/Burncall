import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, leadsTable, appointmentsTable, conversationsTable, automationsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);
// Per the Team permission matrix: the revenue dashboard is owner/admin only
router.use(requireRole("owner", "admin"));

function dayKey(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function monthKey(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" });
}

// GET /api/dashboard/stats
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  const businessId = req.auth!.businessId;

  const leads = await db.select().from(leadsTable).where(eq(leadsTable.businessId, businessId));
  const appointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.businessId, businessId));

  const convRows = await db
    .select({ conv: conversationsTable, lead: leadsTable })
    .from(conversationsTable)
    .innerJoin(leadsTable, eq(conversationsTable.leadId, leadsTable.id))
    .where(eq(leadsTable.businessId, businessId));

  const automations = await db.select().from(automationsTable).where(eq(automationsTable.businessId, businessId));

  const responseTimes = leads.map((l) => l.aiResponseTime).filter((t): t is number => typeof t === "number");
  const avgResponseTime = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;

  const qualifiedLeads = leads.filter((l) => ["qualified", "booked", "won"].includes(l.status)).length;
  const appointmentsBooked = appointments.filter((a) => a.status !== "cancelled").length;
  const estimatedRevenueRescued = leads.filter((l) => l.status === "won").reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const needsAttentionConvs = convRows.filter(({ conv }) => conv.status === "needs_human");
  const needsAttention = needsAttentionConvs.slice(0, 10).map(({ conv, lead }) => ({
    id: lead.id,
    name: lead.name,
    issue: "Needs a human response",
    type: lead.urgency === "emergency" ? "urgent" : "missed_call",
    minutesAgo: Math.round((Date.now() - new Date(conv.updatedAt).getTime()) / 60000),
  }));

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((l) => ({ id: l.id, name: l.name, service: l.service, status: l.status, urgency: l.urgency, createdAt: l.createdAt, estimatedValue: l.estimatedValue }));

  const todayWins: string[] = [];
  const bookedToday = leads.filter((l) => l.status === "booked" && new Date(l.updatedAt).toDateString() === new Date().toDateString());
  bookedToday.slice(0, 3).forEach((l) => todayWins.push(`${l.name} booked ${l.service || "an appointment"}`));
  if (responseTimes.length) todayWins.push(`AI responded to ${responseTimes.length} lead${responseTimes.length === 1 ? "" : "s"} in an average of ${avgResponseTime}s`);
  const aiClosedConvs = convRows.filter(({ conv }) => conv.status !== "needs_human" && conv.aiHandled).length;
  if (aiClosedConvs) todayWins.push(`${aiClosedConvs} conversation${aiClosedConvs === 1 ? "" : "s"} fully handled by AI, no human needed`);

  const automationPerformance = automations.map((a) => ({
    name: a.name,
    triggered: a.stats?.triggered ?? 0,
    success: a.stats?.sent ?? 0,
    rate: a.stats?.triggered ? Math.round(((a.stats.sent ?? 0) / a.stats.triggered) * 100) : 0,
  }));

  res.json({
    metrics: {
      leadsReceived: leads.length,
      avgResponseTime,
      qualifiedLeads,
      appointmentsBooked,
      estimatedRevenueRescued,
      needsAttentionCount: needsAttentionConvs.length,
    },
    todayWins,
    recentLeads,
    needsAttention,
    automationPerformance,
  });
});

// GET /api/dashboard/charts
router.get("/dashboard/charts", async (req: Request, res: Response) => {
  const businessId = req.auth!.businessId;
  const leads = await db.select().from(leadsTable).where(eq(leadsTable.businessId, businessId));

  // Leads by day — last 7 days
  const days: { date: string; leads: number; qualified: number; booked: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const dayLeads = leads.filter((l) => dayKey(new Date(l.createdAt)) === key);
    days.push({
      date: key,
      leads: dayLeads.length,
      qualified: dayLeads.filter((l) => ["qualified", "booked", "won"].includes(l.status)).length,
      booked: dayLeads.filter((l) => l.status === "booked" || l.status === "won").length,
    });
  }

  // Source breakdown
  const sourceCounts = new Map<string, number>();
  for (const l of leads) sourceCounts.set(l.source, (sourceCounts.get(l.source) ?? 0) + 1);
  const sourceBreakdown = Array.from(sourceCounts.entries()).map(([source, count]) => ({
    source,
    count,
    pct: leads.length ? Math.round((count / leads.length) * 100) : 0,
  }));

  // Funnel
  const funnel = [
    { stage: "Received", count: leads.length },
    { stage: "Contacted", count: leads.filter((l) => l.lastContactedAt).length },
    { stage: "Qualified", count: leads.filter((l) => ["qualified", "booked", "won"].includes(l.status)).length },
    { stage: "Booked", count: leads.filter((l) => l.status === "booked" || l.status === "won").length },
    { stage: "Won", count: leads.filter((l) => l.status === "won").length },
  ];

  // Revenue rescued by month (won leads only) — last 6 months
  const months: { month: string; rescued: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = monthKey(d);
    const rescued = leads
      .filter((l) => l.status === "won" && monthKey(new Date(l.updatedAt)) === key)
      .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    months.push({ month: key, rescued });
  }

  res.json({ leadsByDay: days, sourceBreakdown, funnel, revenueRescued: months });
});

export default router;
