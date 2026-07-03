import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db, conversationsTable, leadsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendSms, sendEmail } from "../lib/notifications";

const router: IRouter = Router();

// All inbox routes are for the authenticated business's team, so require auth.
router.use(requireAuth);

// GET /api/inbox
router.get("/inbox", async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };

  const rows = await db
    .select({ conv: conversationsTable, lead: leadsTable })
    .from(conversationsTable)
    .innerJoin(leadsTable, eq(conversationsTable.leadId, leadsTable.id))
    .where(eq(leadsTable.businessId, req.auth!.businessId))
    .orderBy(desc(conversationsTable.updatedAt));

  let conversations = rows.map(({ conv, lead }) => ({ ...conv, leadName: lead.name }));
  if (status && status !== "all") conversations = conversations.filter((c) => c.status === status);

  res.json({ conversations, total: conversations.length });
});

// GET /api/inbox/:id
router.get("/inbox/:id", async (req: Request, res: Response) => {
  const conv = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.id, Number(req.params.id)) });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const lead = await db.query.leadsTable.findFirst({ where: eq(leadsTable.id, conv.leadId) });
  if (!lead || lead.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json({ ...conv, leadName: lead.name, lead });
});

// POST /api/inbox/:id/takeover
router.post("/inbox/:id/takeover", async (req: Request, res: Response) => {
  const conv = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.id, Number(req.params.id)) });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const [updated] = await db
    .update(conversationsTable)
    .set({ status: "open", takenOverBy: req.body?.agentName || "Team Member", takenOverAt: new Date(), aiHandled: false })
    .where(eq(conversationsTable.id, conv.id))
    .returning();
  res.json(updated);
});

// POST /api/inbox/:id/reply
// A human team member sends a real message — actually delivers it via
// SMS/email based on the lead's channel, using real Resend/Twilio SDKs.
router.post("/inbox/:id/reply", async (req: Request, res: Response) => {
  const conv = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.id, Number(req.params.id)) });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const lead = await db.query.leadsTable.findFirst({ where: eq(leadsTable.id, conv.leadId) });
  if (!lead || lead.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const content: string = req.body?.content ?? "";
  if (!content.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const message = { role: "human" as const, content, ts: new Date().toISOString() };
  const messages = [...(conv.messages ?? []), message];

  const [updated] = await db
    .update(conversationsTable)
    .set({ messages, updatedAt: new Date() })
    .where(eq(conversationsTable.id, conv.id))
    .returning();

  // Real delivery to the customer, gated by whichever contact info exists.
  if (conv.channel === "sms" && lead.phone) {
    await sendSms({ to: lead.phone, body: content });
  } else if (lead.email) {
    await sendEmail({ to: lead.email, subject: "Re: your request", text: content });
  }

  res.json(updated);
});

export default router;
