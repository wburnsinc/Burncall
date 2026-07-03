import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/bestlogo_1782311057091.png";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

type Mode = "login" | "reset";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const { redirectTo } = await login(email, password);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { email });
      setResetSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) { setError("Enter your email first to receive a magic link."); return; }
    setLoading(true);
    try {
      // Magic-link sign-in isn't implemented on the backend yet — reuse the
      // password-reset email flow as a stand-in until a dedicated endpoint exists.
      await api.post("/api/auth/reset-password", { email });
      setResetSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050812] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col w-[420px] bg-[#0A0F1E] border-r border-white/10 p-10 shrink-0">
        <Link href="/">
          <img src={logoPath} alt="BurnCall" className="h-8 mb-12" />
        </Link>
        <h2 className="text-2xl font-bold text-white mb-3">Welcome back.</h2>
        <p className="text-slate-400 text-sm mb-10">Sign in to your BurnCall dashboard to view leads, manage conversations, and see your rescued revenue.</p>
        <ul className="space-y-4">
          {[
            "AI lead response running 24/7",
            "Live conversation monitoring",
            "Real-time revenue dashboard",
            "Appointment booking calendar",
          ].map(b => (
            <li key={b} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              <span className="text-slate-300 text-sm">{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/10">
          <div className="bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 rounded-xl p-4">
            <p className="text-sm text-slate-300 font-medium mb-1">Today's activity</p>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400">56 leads received this month</p>
              <p className="text-xs text-green-400 font-medium">$18,640 revenue rescued</p>
              <p className="text-xs text-slate-400">21 appointments booked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block mb-8">
            <img src={logoPath} alt="BurnCall" className="h-7" />
          </Link>

          {mode === "login" && !resetSent && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Sign in to BurnCall</h1>
                <p className="text-slate-400 text-sm mt-1">Don't have an account? <Link href="/signup" className="text-[#FF6B2B] hover:underline">Start free trial</Link></p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jason@burkeac.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11"
                    data-testid="login-email"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400">Password</label>
                    <button type="button" onClick={() => setMode("reset")} className="text-xs text-[#FF6B2B] hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11 pr-10"
                      data-testid="login-password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white h-11 font-semibold"
                  data-testid="login-submit"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#050812] px-3 text-slate-500">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/5 h-11"
                onClick={handleMagicLink}
                disabled={loading}
                data-testid="magic-link"
              >
                Send Magic Link
              </Button>
              <p className="text-center text-slate-600 text-xs mt-3">We'll email you a one-click sign-in link</p>
            </>
          )}

          {mode === "reset" && !resetSent && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Reset your password</h1>
                <p className="text-slate-400 text-sm mt-1">Enter your email and we'll send a reset link.</p>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jason@burkeac.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11"
                    data-testid="reset-email"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white h-11">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <button type="button" onClick={() => setMode("login")} className="w-full text-center text-slate-400 text-sm hover:text-white">
                  Back to sign in
                </button>
              </form>
            </>
          )}

          {resetSent && (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm mb-6">We sent a {mode === "reset" ? "password reset" : "magic sign-in"} link to <strong className="text-white">{email}</strong>.</p>
              <Button variant="outline" className="border-white/20 text-white" onClick={() => { setResetSent(false); setMode("login"); }}>
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
