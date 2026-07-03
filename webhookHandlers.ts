import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, businessesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/business — full profile for the authenticated business
// (used by Settings, Knowledge Base, and Onboarding)
router.get("/business", async (req: Request, res: Response) => {
  const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, req.auth!.businessId) });
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(business);
});

// PATCH /api/business — update profile / services / faqs / onboarding fields
const EDITABLE_FIELDS = [
  "name",
  "industry",
  "website",
  "phone",
  "serviceArea",
  "emergencyService",
  "replyTone",
  "calendarLink",
  "notifyEmails",
  "services",
  "faqs",
  "policies",
  "monthlyLeadTarget",
  "avgJobValue",
  "apptTarget",
  "onboardingCompleted",
] as const;

// Knowledge base + settings editing: owner, admin, dispatcher (not technician), per the Team permission matrix
router.patch("/business", requireRole("owner", "admin", "dispatcher"), async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No editable fields provided" });
    return;
  }

  const [updated] = await db
    .update(businessesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(businessesTable.id, req.auth!.businessId))
    .returning();

  res.json(updated);
});

export default router;
