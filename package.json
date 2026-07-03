import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, webhooksTable, WEBHOOK_EVENT_TYPES } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/webhooks
router.get("/webhooks", async (req: Request, res: Response) => {
  const hooks = await db.select().from(webhooksTable).where(eq(webhooksTable.businessId, req.auth!.businessId));
  res.json({ webhooks: hooks, availableEvents: WEBHOOK_EVENT_TYPES });
});

// POST /api/webhooks — register a new outbound webhook (owner/admin only)
router.post("/webhooks", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const { url, events } = req.body ?? {};
  if (!url || !Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: "url and a non-empty events array are required" });
    return;
  }
  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: "url must be a valid absolute URL" });
    return;
  }
  const invalid = events.filter((e: string) => !WEBHOOK_EVENT_TYPES.includes(e as any));
  if (invalid.length > 0) {
    res.status(400).json({ error: `Unknown event types: ${invalid.join(", ")}` });
    return;
  }

  const secret = crypto.randomBytes(24).toString("hex");
  const [hook] = await db.insert(webhooksTable).values({ businessId: req.auth!.businessId, url, events, secret, enabled: true }).returning();
  res.status(201).json(hook);
});

// PATCH /api/webhooks/:id — toggle enabled / change subscribed events
router.patch("/webhooks/:id", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const hook = await db.query.webhooksTable.findFirst({ where: eq(webhooksTable.id, Number(req.params.id)) });
  if (!hook || hook.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }
  const { url, events, enabled } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (url) updates.url = url;
  if (events) updates.events = events;
  if (typeof enabled === "boolean") updates.enabled = enabled;

  const [updated] = await db.update(webhooksTable).set(updates).where(eq(webhooksTable.id, hook.id)).returning();
  res.json(updated);
});

// DELETE /api/webhooks/:id
router.delete("/webhooks/:id", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const hook = await db.query.webhooksTable.findFirst({ where: eq(webhooksTable.id, Number(req.params.id)) });
  if (!hook || hook.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }
  await db.delete(webhooksTable).where(eq(webhooksTable.id, hook.id));
  res.json({ success: true });
});

export default router;
