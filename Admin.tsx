import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./auth-context";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050812] text-white">
        <div className="animate-pulse text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  if (!user) return null; // redirect effect above handles navigation

  return <>{children}</>;
}

export function RequirePlatformAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (!user.isPlatformAdmin) { navigate("/dashboard"); return; }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050812] text-white">
        <div className="animate-pulse text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  if (!user || !user.isPlatformAdmin) return null; // redirect effect above handles navigation

  return <>{children}</>;
}
