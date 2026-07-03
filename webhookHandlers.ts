import { eq } from "drizzle-orm";
import { getStripeClient } from "./stripeClient";
import { db, businessesTable } from "@workspace/db";
import { logger } from "./lib/logger";
import type Stripe from "stripe";

function planFromPriceMetadata(product: Stripe.Product | string | null): string {
  if (product && typeof product === "object" && "metadata" in product) {
    return (product.metadata as Record<string, string>)?.plan || "starter";
  }
  return "starter";
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "Webhook payload must be a Buffer. Ensure webhook route is registered BEFORE express.json().",
      );
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn("STRIPE_WEBHOOK_SECRET not set — skipping webhook signature verification");
      return;
    }
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const businessId = Number(session.metadata?.businessId);
          if (!businessId || !session.customer) break;

          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          let plan = "starter";
          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product"] });
            const price = sub.items.data[0]?.price;
            plan = planFromPriceMetadata(price?.product ?? null);
          }

          await db
            .update(businessesTable)
            .set({
              stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer.id,
              stripeSubscriptionId: subscriptionId ?? null,
              subscriptionStatus: "trialing",
              plan,
              updatedAt: new Date(),
            })
            .where(eq(businessesTable.id, businessId));
          logger.info({ businessId, plan }, "Stripe checkout completed — business subscription activated");
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const businessId = Number(sub.metadata?.businessId);
          if (!businessId) break;

          const price = sub.items.data[0]?.price;
          const plan = planFromPriceMetadata(price?.product ?? null);
          const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

          await db
            .update(businessesTable)
            .set({ subscriptionStatus: status, plan, updatedAt: new Date() })
            .where(eq(businessesTable.id, businessId));
          logger.info({ businessId, status, plan }, "Stripe subscription updated");
          break;
        }

        default:
          // Other event types are received and verified but intentionally not acted on.
          break;
      }
    } catch (err) {
      logger.error({ err, eventType: event.type }, "Failed to process Stripe webhook event");
      // Re-throw so Stripe retries delivery — we don't want to silently drop a failed update.
      throw err;
    }
  }
}
