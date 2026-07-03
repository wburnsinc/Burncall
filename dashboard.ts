import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import { dispatchEvent } from "../lib/webhookDispatcher";

// Per the Team permission matrix: leads are visible/manageable to owner, admin, dispatcher (not technician)

const router: IRouter = Router();
router.use(requireAuth);
router.use(requireRole("owner", "admin", "dispatcher"));

// GET /api/leads
router.get("/leads", async (req: Request, res: Response) => {
  const { status, source, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const businessId = req.auth!.businessId;

  const conditions = [eq(leadsTable.businessId, businessId)];
  if (status && status !== "all") conditions.push(eq(leadsTable.status, status));
  if (source && source !== "all") conditions.push(eq(leadsTable.source, source));
  if (search) {
    const q = `%${search}%`;
    conditions.push(or(ilike(leadsTable.name, q), ilike(leadsTable.email, q), ilike(leadsTable.phone, q))!);
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);

  const all = await db.select().from(leadsTable).where(and(...conditions)).orderBy(desc(leadsTable.createdAt));
  const total = all.length;
  const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({ leads: paginated, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
});

// GET /api/leads/:id
router.get("/leads/:id", async (req: Request, res: Response) => {
  const lead = await db.query.leadsTable.findFirst({ where: eq(leadsTable.id, Number(req.params.id)) });
  if (!lead || lead.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

// PATCH /api/leads/:id
router.patch("/leads/:id", async (req: Request, res: Response) => {
  const lead = await db.query.leadsTable.findFirst({ where: eq(leadsTable.id, Number(req.params.id)) });
  if (!lead || lead.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  // Never let the body override which business owns this lead.
  const { businessId: _ignore, id: _ignoreId, ...safeUpdates } = req.body ?? {};
  const [updated] = await db
    .update(leadsTable)
    .set({ ...safeUpdates, updatedAt: new Date() })
    .where(eq(leadsTable.id, lead.id))
    .returning();

  if (safeUpdates.status && safeUpdates.status !== lead.status && ["qualified", "won", "lost"].includes(safeUpdates.status)) {
    dispatchEvent(req.auth!.businessId, `lead.${safeUpdates.status}`, { leadId: updated.id, name: updated.name, service: updated.service, estimatedValue: updated.estimatedValue }).catch(() => {});
  }

  res.json(updated);
});

// POST /api/leads
// Manual lead creation from the dashboard (e.g. a phone call logged by staff).
// AI-sourced leads come in through /api/ai/receptionist/message and
// /api/twilio/sms-inbound instead.
router.post("/leads", async (req: Request, res: Response) => {
  const { name, email, phone, source, channel, message, service, zipCode, urgency, estimatedValue } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [lead] = await db
    .insert(leadsTable)
    .values({
      businessId: req.auth!.businessId,
      name,
      email: email || null,
      phone: phone || null,
      source: source || "website",
      channel: channel || "web",
      message: message || null,
      service: service || null,
      zipCode: zipCode || null,
      urgency: urgency || null,
      estimatedValue: estimatedValue ?? null,
      status: "new",
      score: 50,
    })
    .returning();
  dispatchEvent(req.auth!.businessId, "lead.created", { leadId: lead.id, name: lead.name, source: lead.source, service: lead.service }).catch(() => {});
  res.status(201).json(lead);
});

export default router;
