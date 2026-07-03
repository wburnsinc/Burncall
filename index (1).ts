import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db, webhooksTable } from "@workspace/db";
import { logger } from "./logger";

/**
 * Real outbound webhook delivery — this is what actually lets a business
 * connect BurnCall to Zapier ("Webhooks by Zapier" trigger), a CRM's inbound
 * webhook endpoint, or any custom tooling, without BurnCall needing to build
 * a dedicated integration for each one.
 *
 * Payloads are signed with HMAC-SHA256 (header: X-BurnCall-Signature) using
 * each webhook's own secret, so the receiver can verify authenticity —
 * standard practice matching how Stripe/GitHub webhooks work.
 */
export async function dispatchEvent(businessId: number, eventType: string, data: Record<string, unknown>): Promise<void> {
  const hooks = await db.select().from(webhooksTable).where(and(eq(webhooksTable.businessId, businessId), eq(webhooksTable.enabled, true)));

  const subscribed = hooks.filter((h) => h.events.includes(eventType));
  if (subscribed.length === 0) return;

  const payload = JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), data });

  await Promise.all(
    subscribed.map(async (hook) => {
      const signature = crypto.createHmac("sha256", hook.secret).update(payload).digest("hex");
      try {
        const res = await fetch(hook.url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-burncall-signature": signature, "x-burncall-event": eventType },
          body: payload,
        });
        await db
          .update(webhooksTable)
          .set({ lastDeliveryAt: new Date(), lastStatus: res.ok ? "ok" : "failed" })
          .where(eq(webhooksTable.id, hook.id));
      } catch (err) {
        logger.error({ err, webhookId: hook.id, eventType }, "Webhook delivery failed");
        await db.update(webhooksTable).set({ lastDeliveryAt: new Date(), lastStatus: "failed" }).where(eq(webhooksTable.id, hook.id));
      }
    }),
  );
}
