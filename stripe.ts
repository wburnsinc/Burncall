import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/integrations/status
// Reports which real integrations are actually configured in this
// environment — a direct env-var presence check, not a mock. This lets the
// Integrations page show accurate connect/disconnect state instead of
// pretending everything is wired up.
router.get("/integrations/status", (_req: Request, res: Response) => {
  res.json({
    integrations: [
      {
        id: "anthropic",
        name: "Anthropic Claude (AI Receptionist)",
        connected: Boolean(process.env.ANTHROPIC_API_KEY),
        required: true,
      },
      {
        id: "resend",
        name: "Resend (Email)",
        connected: Boolean(process.env.RESEND_API_KEY),
        required: false,
      },
      {
        id: "twilio",
        name: "Twilio (SMS)",
        connected: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
        required: false,
      },
      {
        id: "stripe",
        name: "Stripe (Billing)",
        connected: Boolean(process.env.STRIPE_SECRET_KEY),
        required: false,
      },
      {
        id: "database",
        name: "PostgreSQL Database",
        connected: Boolean(process.env.DATABASE_URL),
        required: true,
      },
    ],
  });
});

export default router;
