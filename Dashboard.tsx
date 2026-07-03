/**
 * Minimal API client for BurnCall's backend.
 *
 * - Reads the backend base URL from VITE_API_URL (set this in your Vercel
 *   project env vars to your Railway/Replit backend URL, e.g.
 *   https://burncall-api.up.railway.app). Falls back to same-origin "" for
 *   local dev when frontend and backend are proxied together.
 * - Sends credentials so the httpOnly session cookie works, AND attaches a
 *   Bearer token from localStorage as a fallback for browsers/deployments
 *   where cross-site cookies get blocked (Safari ITP, etc).
 */

export const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "burncall_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage unavailable (e.g. private browsing) — cookie auth still works.
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message = (data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : null) || `Request failed (${response.status})`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
