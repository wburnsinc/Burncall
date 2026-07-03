import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken } from "./api";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  isPlatformAdmin: boolean;
}

interface Business {
  id: number;
  name: string;
  industry?: string;
  plan?: string;
  onboardingCompleted: boolean;
}

interface AuthState {
  user: User | null;
  business: Business | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ redirectTo: string }>;
  signup: (data: { email: string; password: string; name: string; businessName?: string; industry?: string; phone?: string }) => Promise<{ redirectTo: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api.get<{ user: User; business: Business | null }>("/api/auth/me");
      setUser(data.user);
      setBusiness(data.business);
    } catch {
      setUser(null);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<{ user: User; business: Business | null; token: string; redirectTo: string }>("/api/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    return { redirectTo: data.redirectTo };
  }

  async function signup(payload: { email: string; password: string; name: string; businessName?: string; industry?: string; phone?: string }) {
    const data = await api.post<{ user: User; business: Business; token: string; redirectTo: string }>("/api/auth/signup", payload);
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    return { redirectTo: data.redirectTo };
  }

  async function logout() {
    await api.post("/api/auth/logout").catch(() => {});
    setToken(null);
    setUser(null);
    setBusiness(null);
  }

  return (
    <AuthContext.Provider value={{ user, business, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
