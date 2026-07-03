/**
 * Seed BurnCall subscription plans into Stripe.
 * Run with: pnpm --filter @workspace/scripts run seed-stripe
 *
 * Idempotent — skips products that already exist.
 */
import Stripe from "stripe";

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY env var is required");

  const stripe = new Stripe(secretKey);

  const PLANS = [
    {
      name: "BurnCall Starter",
      description: "1 location · Up to 100 leads/month · Instant web lead response · AI qualification · Email notifications · Basic reporting",
      monthlyAmount: 14900,   // $149
      annualAmount: 143040,   // $149 × 12 × 0.8 = $1,430.40
      metadata: { plan: "starter", leads_limit: "100", locations: "1" },
    },
    {
      name: "BurnCall Growth",
      description: "Up to 500 leads/month · SMS automation · Missed-call text back · Calendar booking · Advanced follow-up · Team inbox · Revenue reporting · 3 team members",
      monthlyAmount: 29900,   // $299
      annualAmount: 287040,   // $299 × 12 × 0.8 = $2,870.40
      metadata: { plan: "growth", leads_limit: "500", locations: "1", team_members: "3" },
    },
    {
      name: "BurnCall Pro",
      description: "Multiple locations · Up to 2,000 leads/month · Custom AI playbooks · Priority support · CRM integrations · API access · White-glove onboarding · Unlimited team members",
      monthlyAmount: 49900,   // $499
      annualAmount: 479040,   // $499 × 12 × 0.8 = $4,790.40
      metadata: { plan: "pro", leads_limit: "2000", locations: "unlimited", team_members: "unlimited" },
    },
  ];

  for (const plan of PLANS) {
    // Check if product already exists
    const existing = await stripe.products.search({
      query: `name:'${plan.name}' AND active:'true'`,
    });

    let productId: string;

    if (existing.data.length > 0) {
      productId = existing.data[0].id;
      console.log(`✓ Already exists: ${plan.name} (${productId})`);
    } else {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: plan.metadata,
      });
      productId = product.id;
      console.log(`✓ Created product: ${plan.name} (${productId})`);
    }

    // Check/create monthly price
    const monthlyPrices = await stripe.prices.list({ product: productId, active: true });
    const hasMonthly = monthlyPrices.data.some(
      (p) => p.recurring?.interval === "month" && p.unit_amount === plan.monthlyAmount
    );
    if (!hasMonthly) {
      const mp = await stripe.prices.create({
        product: productId,
        unit_amount: plan.monthlyAmount,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { billing: "monthly" },
      });
      console.log(`  + Monthly price: $${plan.monthlyAmount / 100}/mo (${mp.id})`);
    } else {
      console.log(`  · Monthly price already exists`);
    }

    // Check/create annual price
    const hasAnnual = monthlyPrices.data.some(
      (p) => p.recurring?.interval === "year" && p.unit_amount === plan.annualAmount
    );
    if (!hasAnnual) {
      const ap = await stripe.prices.create({
        product: productId,
        unit_amount: plan.annualAmount,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { billing: "annual", discount: "20%" },
      });
      console.log(`  + Annual price: $${plan.annualAmount / 100}/yr (${ap.id})`);
    } else {
      console.log(`  · Annual price already exists`);
    }
  }

  console.log("\nAll BurnCall plans seeded successfully.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
