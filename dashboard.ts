import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, businessesTable, leadsTable, conversationsTable } from "@workspace/db";
import { runReceptionistTurn } from "../lib/receptionist";
import { dispatchEvent } from "../lib/webhookDispatcher";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * POST /api/twilio/sms-inbound
 * Configure this URL as the "A message comes in" webhook on your Twilio
 * phone number (Twilio Console → Phone Numbers → your number → Messaging).
 * Twilio posts application/x-www-form-urlencoded, so this needs urlencoded
 * body parsing — app.ts already applies express.urlencoded() globally.
 *
 * Matches the inbound number (`To`) to a business by phone number. Replies
 * with TwiML so Twilio sends the AI's reply back as an SMS automatically —
 * no separate outbound send needed for the reply itself.
 */
router.post("/twilio/sms-inbound", async (req: Request, res: Response) => {
  const from = req.body?.From as string | undefined;
  const to = req.body?.To as string | undefined;
  const body = (req.body?.Body as string | undefined) ?? "";

  res.set("Content-Type", "text/xml");

  if (!from || !to || !body.trim()) {
    res.send("<Response></Response>");
    return;
  }

  try {
    const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.phone, to) });
    if (!business) {
      logger.warn({ to }, "Inbound SMS to unrecognized business number");
      res.send("<Response></Response>");
      return;
    }

    let lead = await db.query.leadsTable.findFirst({ where: eq(leadsTable.phone, from) });
    let conversation;

    if (!lead) {
      [lead] = await db
        .insert(leadsTable)
        .values({ businessId: business.id, name: from, phone: from, source: "sms", channel: "sms", message: body, status: "new" })
        .returning();
      dispatchEvent(business.id, "lead.created", { leadId: lead.id, name: lead.name, source: "sms" }).catch(() => {});
    }

    conversation = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.leadId, lead.id) });
    if (!conversation) {
      [conversation] = await db
        .insert(conversationsTable)
        .values({ leadId: lead.id, channel: "sms", status: "open", aiHandled: true, messages: [] })
        .returning();
    }

    const history = conversation.messages ?? [];
    const { reply, conversationStatus } = await runReceptionistTurn({
      businessId: business.id,
      leadId: lead.id,
      history,
      customerMessage: body,
    });

    const updatedMessages = [
      ...history,
      { role: "customer" as const, content: body, ts: new Date().toISOString() },
      { role: "ai" as const, content: reply, ts: new Date().toISOString() },
    ];
    await db.update(conversationsTable).set({ messages: updatedMessages, status: conversationStatus, updatedAt: new Date() }).where(eq(conversationsTable.id, conversation.id));

    // Escape XML special chars for safety before embedding in TwiML.
    const safeReply = reply.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    res.send(`<Response><Message>${safeReply}</Message></Response>`);
  } catch (err) {
    logger.error({ err }, "Twilio inbound SMS handling failed");
    res.send("<Response><Message>Thanks for your message — a team member will follow up shortly.</Message></Response>");
  }
});

export default router;
