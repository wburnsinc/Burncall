import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthTokenPayload } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

/**
 * Reads a Bearer token from the Authorization header (or `token` cookie as a
 * fallback for browser sessions), verifies it, and attaches the decoded
 * payload to req.auth. Responds 401 if missing/invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer || req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  req.auth = payload;
  next();
}

/**
 * Enforces the role matrix shown on the Team page. Must run after
 * requireAuth (reads req.auth.role). "owner" always passes regardless of
 * the allowed list, since the owner can do everything by definition.
 */
export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (role === "owner" || allowed.includes(role)) {
      next();
      return;
    }
    res.status(403).json({ error: `This action requires one of these roles: ${allowed.join(", ")}. Your role: ${role}.` });
  };
}

/**
 * Restricts to real cross-tenant platform admins only (see
 * PLATFORM_ADMIN_EMAILS / lib/auth.ts syncPlatformAdminStatus). This is
 * intentionally separate from requireRole's per-business owner/admin roles —
 * a business owner is NOT a platform admin by default.
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth?.isPlatformAdmin) {
    res.status(403).json({ error: "Platform admin access required" });
    return;
  }
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer || req.cookies?.token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.auth = payload;
  }
  next();
}
