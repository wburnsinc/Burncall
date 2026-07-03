import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, automationsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/automations
router.get("/automations", async (req: Request, res: Response) => {
  const automations = await db.select().from(automationsTable).where(eq(automationsTable.businessId, req.auth!.businessId));
  res.json({ automations, total: automations.length });
});

// GET /api/automations/:id
router.get("/automations/:id", async (req: Request, res: Response) => {
  const auto = await db.query.automationsTable.findFirst({ where: eq(automationsTable.id, Number(req.params.id)) });
  if (!auto || auto.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }
  res.json(auto);
});

// PATCH /api/automations/:id (toggle enabled, edit template, etc.)
router.patch("/automations/:id", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const auto = await db.query.automationsTable.findFirst({ where: eq(automationsTable.id, Number(req.params.id)) });
  if (!auto || auto.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }
  const { businessId: _ignore, id: _ignoreId, ...safeUpdates } = req.body ?? {};
  const [updated] = await db
    .update(automationsTable)
    .set({ ...safeUpdates, updatedAt: new Date() })
    .where(eq(automationsTable.id, auto.id))
    .returning();
  res.json(updated);
});

// POST /api/automations
router.post("/automations", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const { name, type, triggerEvent, channel, templateBody, delayMinutes, conditions } = req.body ?? {};
  if (!name || !type || !triggerEvent) {
    res.status(400).json({ error: "name, type, and triggerEvent are required" });
    return;
  }
  const [auto] = await db
    .insert(automationsTable)
    .values({
      businessId: req.auth!.businessId,
      name,
      type,
      triggerEvent,
      channel: channel || "sms",
      templateBody: templateBody || null,
      delayMinutes: delayMinutes ?? 0,
      conditions: conditions ?? {},
      enabled: false,
      stats: { triggered: 0, sent: 0, failed: 0, opened: 0 },
    })
    .returning();
  res.status(201).json(auto);
});

export default router;
