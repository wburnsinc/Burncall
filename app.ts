import Stripe from "stripe";

/**
 * Returns a fresh authenticated Stripe client using STRIPE_SECRET_KEY env var.
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  return new Stripe(secretKey);
}
