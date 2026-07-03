import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET must be set in production");
}

// Falls back to a dev-only secret so local/demo runs don't crash before .env is filled in.
const SECRET = JWT_SECRET || "dev-only-insecure-secret-change-me";

export interface AuthTokenPayload {
  userId: number;
  businessId: number;
  role: string;
  isPlatformAdmin?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

/**
 * Platform-admin access is controlled entirely by PLATFORM_ADMIN_EMAILS, an
 * env var (comma-separated emails) — never settable through signup, invite,
 * or any user-facing form. This is intentional: the only way to grant it is
 * to edit your deployment's environment variables and redeploy.
 */
export function isPlatformAdminEmail(email: string): boolean {
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}
