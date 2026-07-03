import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, businessesTable, teamMembersTable } from "@workspace/db";
import { hashPassword, verifyPassword, signToken, verifyToken, isPlatformAdminEmail } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function setSessionCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/signup
router.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name, businessName, industry, phone } = req.body ?? {};

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
    if (existing) {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const isPlatformAdmin = isPlatformAdminEmail(email);

    const [user] = await db
      .insert(usersTable)
      .values({ email: email.toLowerCase(), name, passwordHash, role: "owner", isEmailVerified: false, isPlatformAdmin })
      .returning();

    const [business] = await db
      .insert(businessesTable)
      .values({
        ownerId: user.id,
        name: businessName || "",
        industry: industry || "",
        phone: phone || "",
        plan: "starter",
        onboardingCompleted: false,
      })
      .returning();

    const token = signToken({ userId: user.id, businessId: business.id, role: user.role, isPlatformAdmin: user.isPlatformAdmin });
    setSessionCookie(res, token);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified, isPlatformAdmin: user.isPlatformAdmin, createdAt: user.createdAt },
      business: { id: business.id, name: business.name, industry: business.industry, phone: business.phone, plan: business.plan, onboardingCompleted: business.onboardingCompleted },
      token,
      redirectTo: "/onboarding",
    });
  } catch (err) {
    logger.error({ err }, "signup failed");
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const business = user.businessId
      ? await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, user.businessId) })
      : await db.query.businessesTable.findFirst({ where: eq(businessesTable.ownerId, user.id) });

    // Re-check the env allowlist on every login so adding/removing an email
    // from PLATFORM_ADMIN_EMAILS takes effect the next time that person logs
    // in — no separate admin-promotion endpoint needed (there isn't one).
    const shouldBeAdmin = isPlatformAdminEmail(user.email);
    if (shouldBeAdmin !== user.isPlatformAdmin) {
      await db.update(usersTable).set({ isPlatformAdmin: shouldBeAdmin }).where(eq(usersTable.id, user.id));
      user.isPlatformAdmin = shouldBeAdmin;
    }

    const token = signToken({ userId: user.id, businessId: business?.id ?? 0, role: user.role, isPlatformAdmin: user.isPlatformAdmin });
    setSessionCookie(res, token);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified, isPlatformAdmin: user.isPlatformAdmin, createdAt: user.createdAt },
      business: business
        ? { id: business.id, name: business.name, industry: business.industry, plan: business.plan, onboardingCompleted: business.onboardingCompleted }
        : null,
      token,
      redirectTo: user.isPlatformAdmin ? "/admin" : business?.onboardingCompleted ? "/dashboard" : "/onboarding",
    });
  } catch (err) {
    logger.error({ err }, "login failed");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.auth!.userId) });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const business = user.businessId
      ? await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, user.businessId) })
      : await db.query.businessesTable.findFirst({ where: eq(businessesTable.ownerId, user.id) });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified, isPlatformAdmin: user.isPlatformAdmin, createdAt: user.createdAt },
    business: business ?? null,
  });
});

// POST /api/auth/reset-password
// Real behavior: generates + emails a reset link when RESEND_API_KEY is configured.
// Always returns a generic success message regardless of whether the email exists,
// to avoid leaking account existence.
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
    if (user) {
      const token = signToken({ userId: user.id, businessId: 0, role: "reset" });
      const { sendEmail } = await import("../lib/notifications");
      const appUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
      await sendEmail({
        to: user.email,
        subject: "Reset your BurnCall password",
        text: `Reset your password: ${appUrl}/reset-password?token=${token}`,
      });
    }
  } catch (err) {
    logger.error({ err }, "reset-password email failed");
  }

  res.json({ success: true, message: "If that email exists, a reset link has been sent." });
});

// POST /api/auth/accept-invite
// Turns a team_members roster row into a real, logged-in user account.
// Token is a short-lived JWT (role: "invite") issued when the invite was sent.
router.post("/auth/accept-invite", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body ?? {};
    if (!token || !password) {
      res.status(400).json({ error: "token and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "invite") {
      res.status(401).json({ error: "This invite link is invalid or has expired." });
      return;
    }

    const member = await db.query.teamMembersTable.findFirst({ where: eq(teamMembersTable.id, payload.userId) });
    if (!member) {
      res.status(404).json({ error: "Invite not found" });
      return;
    }
    if (member.userId) {
      res.status(409).json({ error: "This invite has already been accepted. Please log in instead." });
      return;
    }

    const existingUser = await db.query.usersTable.findFirst({ where: eq(usersTable.email, member.email.toLowerCase()) });
    if (existingUser) {
      res.status(409).json({ error: "An account with that email already exists. Please log in instead." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({ email: member.email.toLowerCase(), name: member.name, passwordHash, role: member.role, businessId: member.businessId, isEmailVerified: true })
      .returning();

    await db.update(teamMembersTable).set({ userId: user.id, status: "active", updatedAt: new Date() }).where(eq(teamMembersTable.id, member.id));

    const business = await db.query.businessesTable.findFirst({ where: eq(businessesTable.id, member.businessId) });
    const sessionToken = signToken({ userId: user.id, businessId: member.businessId, role: user.role });
    setSessionCookie(res, sessionToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified, createdAt: user.createdAt },
      business: business ?? null,
      token: sessionToken,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    logger.error({ err }, "accept-invite failed");
    res.status(500).json({ error: "Failed to accept invite. Please try again." });
  }
});

export default router;
