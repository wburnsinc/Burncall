import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, leadsTable, conversationsTable, businessesTable } from "@workspace/db";
import { runReceptionistTurn, testReceptionistReply } from "../lib/receptionist";
import { requireAuth } from "../middlewares/requireAuth";
import { dispatchEvent } from "../lib/webhookDispatcher";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// POST /api/ai/test
// Authenticated preview endpoint for the Knowledge Base "Test AI Response"
// tool. Runs a real Claude call using the business's live system prompt, but
// writes nothing to the database — safe to click repeatedly while tuning
// services/FAQs/tone.
router.post("/ai/test", requireAuth, async (req: Request, res: Response) => {
  const { message } = req.body ?? {};
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    const reply = await testReceptionistReply(req.auth!.businessId, message);
    res.json({ reply });
  } catch (err) {
    logger.error({ err }, "AI test call failed");
    const msg = err instanceof Error ? err.message : "AI test error";
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/ai/receptionist/message
 * Public inbound endpoint (embedded on the business's own site's chat widget,
 * or called by an SMS/webhook adapter). No auth required — identifies the
 * business via businessId in the body, matching how a public web-chat widget
 * would call this.
 *
 * Body: { businessId, leadId?, name?, email?, phone?, channel, message }
 * If leadId is omitted, a new lead + conversation is created.
 */
router.post("/ai/receptionist/message", async (req: Request, res: Response) => {
  try {
    const { businessId, leadId, name, email, phone, channel, message } = req.body ?? {};

    if (!businessId || !message) {
      res.status(400).json({ error: "businessId and message are required" });
      return;
    }

    const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, Number(businessId)) });
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    let lead;
    let conversation;

    if (leadId) {
      lead = await db.query.leadsTable.findFirst({ where: eq(leadsTable.id, Number(leadId)) });
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      conversation = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.leadId, lead.id) });
    } else {
      const start = Date.now();
      [lead] = await db
        .insert(leadsTable)
        .values({
          businessId: business.id,
          name: name || "Website visitor",
          email: email || null,
          phone: phone || null,
          source: channel === "sms" ? "sms" : "website",
          channel: channel || "web",
          message,
          status: "new",
        })
        .returning();
      dispatchEvent(business.id, "lead.created", { leadId: lead.id, name: lead.name, source: lead.source, channel: lead.channel }).catch(() => {});

      [conversation] = await db
        .insert(conversationsTable)
        .values({ leadId: lead.id, channel: channel || "webchat", status: "open", aiHandled: true, messages: [] })
        .returning();

      // record AI response time once we reply, below.
      req.app.locals.__leadStart = start;
    }

    if (!conversation) {
      [conversation] = await db
        .insert(conversationsTable)
        .values({ leadId: lead.id, channel: channel || "webchat", status: "open", aiHandled: true, messages: [] })
        .returning();
    }

    const history = conversation.messages ?? [];
    const start = Date.now();

    const { reply, conversationStatus } = await runReceptionistTurn({
      businessId: business.id,
      leadId: lead.id,
      history,
      customerMessage: message,
    });

    const responseSeconds = Math.round((Date.now() - start) / 1000);

    const updatedMessages = [
      ...history,
      { role: "customer" as const, content: message, ts: new Date().toISOString() },
      { role: "ai" as const, content: reply, ts: new Date().toISOString() },
    ];

    await db
      .update(conversationsTable)
      .set({ messages: updatedMessages, status: conversationStatus, updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversation.id));

    if (!leadId) {
      await db.update(leadsTable).set({ aiResponseTime: responseSeconds, lastContactedAt: new Date() }).where(eq(leadsTable.id, lead.id));
    }

    res.json({ leadId: lead.id, conversationId: conversation.id, reply, status: conversationStatus });
  } catch (err) {
    logger.error({ err }, "AI receptionist turn failed");
    const message = err instanceof Error ? err.message : "AI receptionist error";
    res.status(500).json({ error: message });
  }
});

export default router;
