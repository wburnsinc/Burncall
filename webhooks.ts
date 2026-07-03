import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, teamMembersTable, businessesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import { signToken } from "../lib/auth";
import { sendEmail } from "../lib/notifications";
import { logger } from "../lib/logger";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/team
router.get("/team", async (req: Request, res: Response) => {
  const members = await db.select().from(teamMembersTable).where(eq(teamMembersTable.businessId, req.auth!.businessId));
  res.json({ members, total: members.length });
});

// POST /api/team — invite a team member. Sends a real email (via Resend, if
// configured) containing an accept-invite link with a 7-day token. Only
// owners/admins can invite.
router.post("/team", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const { name, email, role } = req.body ?? {};
  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }

  const [member] = await db
    .insert(teamMembersTable)
    .values({ businessId: req.auth!.businessId, name, email, role: role || "technician", status: "invited" })
    .returning();

  // The invite token embeds the team_members row id in the `userId` slot of
  // the JWT payload, tagged with role "invite" so it can only be redeemed at
  // /api/auth/accept-invite — never treated as a real session token.
  const inviteToken = signToken({ userId: member.id, businessId: req.auth!.businessId, role: "invite" });

  try {
    const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, req.auth!.businessId) });
    const appUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${business?.name || "a team"} on BurnCall`,
      text: `${name}, you've been invited to join ${business?.name || "the team"} on BurnCall as a ${role || "technician"}. Set up your account here: ${appUrl}/accept-invite?token=${inviteToken}\n\nThis link expires in 7 days.`,
    });
  } catch (err) {
    logger.error({ err }, "team invite email failed");
    // Member is still created even if the email fails — the accept link is
    // also returned in the response so it can be shared manually if needed.
  }

  res.status(201).json({ ...member, inviteToken });
});

// PATCH /api/team/:id — update role/status
router.patch("/team/:id", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const member = await db.query.teamMembersTable.findFirst({ where: eq(teamMembersTable.id, Number(req.params.id)) });
  if (!member || member.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  const { name, role, status } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (role) updates.role = role;
  if (status) updates.status = status;

  const [updated] = await db
    .update(teamMembersTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(teamMembersTable.id, member.id))
    .returning();
  res.json(updated);
});

// DELETE /api/team/:id — remove a team member
router.delete("/team/:id", requireRole("owner", "admin"), async (req: Request, res: Response) => {
  const member = await db.query.teamMembersTable.findFirst({ where: eq(teamMembersTable.id, Number(req.params.id)) });
  if (!member || member.businessId !== req.auth!.businessId) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  await db.delete(teamMembersTable).where(eq(teamMembersTable.id, member.id));
  res.json({ success: true });
});

export default router;
