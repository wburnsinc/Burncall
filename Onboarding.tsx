import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, TrendingUp, Bot, AlertCircle, Search, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Account { id: number; name: string; email: string; industry: string; plan: string; status: string; leads: number; mrr: number; joined: string }
interface Stats { totalAccounts: number; activeAccounts: number; trialAccounts: number; churnedAccounts: number; mrr: number; totalLeads: number; mrrByJoinMonth: { month: string; mrr: number }[] }
interface AutomationHealth { name: string; triggers: number; success: number; failures: number; rate: number }
interface AiUsage { day: string; tokens: number; calls: number }

const STATUS_COLOR: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border-green-500/30",
  Trial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Churned: "bg-red-500/20 text-red-400 border-red-500/30",
  "No Subscription": "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function Admin() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [automationHealth, setAutomationHealth] = useState<AutomationHealth[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ accounts: Account[] }>("/api/admin/accounts"),
      api.get<Stats>("/api/admin/stats"),
      api.get<{ automationHealth: AutomationHealth[] }>("/api/admin/automation-health"),
      api.get<{ usage: AiUsage[]; totalCalls: number; totalTokens: number }>("/api/admin/ai-usage"),
    ])
      .then(([acc, s, health, usage]) => {
        setAccounts(acc.accounts);
        setStats(s);
        setAutomationHealth(health.automationHealth);
        setAiUsage(usage.usage);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load platform admin data"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-[#050812] p-6 text-slate-400 text-sm">Loading platform data…</div>;
  if (error) return <div className="min-h-screen bg-[#050812] p-6 text-red-400 text-sm">Couldn't load platform admin data: {error}</div>;

  return (
    <div className="min-h-screen bg-[#050812] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#FF6B2B]/10 flex items-center justify-center"><Shield className="h-5 w-5 text-[#FF6B2B]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
            <p className="text-slate-400 text-sm">Signed in as {user?.email} — visible only to platform admins (PLATFORM_ADMIN_EMAILS)</p>
          </div>
        </div>
        <Link href="/dashboard"><Button variant="outline" className="border-white/20 text-white text-sm">Back to My Dashboard</Button></Link>
      </div>

      {/* Platform metrics — all real */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-blue-400" /><p className="text-xs text-slate-500 uppercase">Accounts</p></div>
          <p className="text-2xl font-bold text-white">{stats?.totalAccounts ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">{stats?.activeAccounts ?? 0} active · {stats?.trialAccounts ?? 0} trial · {stats?.churnedAccounts ?? 0} churned</p>
        </div>
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-green-400" /><p className="text-xs text-slate-500 uppercase">Estimated MRR</p></div>
          <p className="text-2xl font-bold text-white">${(stats?.mrr ?? 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Estimated from plan tier — actual billing truth lives in Stripe</p>
        </div>
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-[#FF6B2B]" /><p className="text-xs text-slate-500 uppercase">Total Leads</p></div>
          <p className="text-2xl font-bold text-white">{stats?.totalLeads ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Across every business</p>
        </div>
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-yellow-400" /><p className="text-xs text-slate-500 uppercase">Churned</p></div>
          <p className="text-2xl font-bold text-white">{stats?.churnedAccounts ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Subscriptions cancelled via Stripe</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6">
          <p className="text-white font-semibold mb-4">Real AI Token Usage (Last 7 Days)</p>
          {aiUsage.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center">No AI calls logged yet — usage appears here as soon as the receptionist runs.</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiUsage}>
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#0A0F1E", borderColor: "rgba(255,255,255,0.1)" }} />
                  <Line type="monotone" dataKey="tokens" stroke="#FF6B2B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-2">Real token counts pulled directly from Anthropic API responses (not estimated).</p>
        </div>

        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6">
          <p className="text-white font-semibold mb-4">Automation Health (All Businesses)</p>
          {automationHealth.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center">No automations have run yet.</p>
          ) : (
            <div className="space-y-3">
              {automationHealth.map((a) => (
                <div key={a.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">{a.name}</p>
                    <p className="text-slate-500 text-xs">{a.triggers} triggers · {a.failures} failures</p>
                  </div>
                  <span className={`text-sm font-semibold ${a.rate >= 90 ? "text-green-400" : a.rate >= 70 ? "text-yellow-400" : "text-red-400"}`}>{a.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accounts table — real businesses */}
      <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-white font-semibold">All Accounts ({accounts.length})</p>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white text-sm" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase border-b border-white/10">
              <th className="text-left p-3">Business</th>
              <th className="text-left p-3">Owner Email</th>
              <th className="text-left p-3 hidden md:table-cell">Industry</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Leads</th>
              <th className="text-left p-3">MRR</th>
              <th className="text-left p-3 hidden lg:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="p-3 text-white font-medium">{a.name}</td>
                <td className="p-3 text-slate-400">{a.email}</td>
                <td className="p-3 hidden md:table-cell text-slate-400">{a.industry}</td>
                <td className="p-3 text-slate-300 capitalize">{a.plan}</td>
                <td className="p-3"><Badge className={`text-xs border ${STATUS_COLOR[a.status] || STATUS_COLOR["No Subscription"]}`}>{a.status}</Badge></td>
                <td className="p-3 text-slate-300">{a.leads}</td>
                <td className="p-3 text-green-400">${a.mrr}</td>
                <td className="p-3 hidden lg:table-cell text-slate-500 text-xs">{new Date(a.joined).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-600 text-sm py-8">No accounts match your search.</p>}
      </div>
    </div>
  );
}
