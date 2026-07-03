import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, PhoneMissed, DollarSign, CalendarCheck, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

interface DashboardStats {
  metrics: {
    leadsReceived: number;
    avgResponseTime: number;
    qualifiedLeads: number;
    appointmentsBooked: number;
    estimatedRevenueRescued: number;
    needsAttentionCount: number;
  };
  todayWins: string[];
  recentLeads: { id: number; name: string; service: string | null; status: string; urgency: string | null; createdAt: string; estimatedValue: number | null }[];
  needsAttention: { id: number; name: string; issue: string; type: string; minutesAgo: number }[];
}

interface DashboardCharts {
  leadsByDay: { date: string; leads: number; qualified: number; booked: number }[];
}

interface Lead {
  id: number;
  name: string;
  service: string | null;
  status: string;
  score: number;
  urgency: string | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>("/api/dashboard/stats"),
      api.get<DashboardCharts>("/api/dashboard/charts"),
      api.get<{ leads: Lead[] }>("/api/leads?limit=50"),
    ])
      .then(([s, c, l]) => {
        setStats(s);
        setCharts(c);
        setLeads(l.leads);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm p-6">Loading your dashboard…</div>;
  }
  if (error) {
    return <div className="text-red-400 text-sm p-6">Couldn't load dashboard data: {error}</div>;
  }
  if (!stats || !charts) return null;

  const byStatus = (status: string) => leads.filter((l) => l.status === status).slice(0, 3);
  const countByStatus = (status: string) => leads.filter((l) => l.status === status).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-slate-400">Here's what's happening with your business today.</p>
        </div>

        <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-4 py-2 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
          <p className="text-sm font-medium text-[#10B981]">
            {stats.todayWins[0] || "AI receptionist is live and monitoring for new leads"}
          </p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="New Leads" value={String(stats.metrics.leadsReceived)} icon={Users} color="text-[#3B82F6]" bg="bg-[#3B82F6]/10" />
        <MetricCard title="Jobs Booked" value={String(stats.metrics.appointmentsBooked)} icon={CalendarCheck} color="text-[#10B981]" bg="bg-[#10B981]/10" />
        <MetricCard title="Revenue Rescued" value={`$${stats.metrics.estimatedRevenueRescued.toLocaleString()}`} icon={DollarSign} color="text-[#FF6B2B]" bg="bg-[#FF6B2B]/10" />
        <MetricCard title="Needs Attention" value={String(stats.metrics.needsAttentionCount)} icon={PhoneMissed} color="text-slate-400" bg="bg-white/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-2 bg-[#0A0F1E] border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Lead Volume & Conversions (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.leadsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B2B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0A0F1E", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} itemStyle={{ color: "#fff" }} />
                  <Area type="monotone" dataKey="leads" name="Total Leads" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                  <Area type="monotone" dataKey="booked" name="Booked Jobs" stroke="#FF6B2B" strokeWidth={2} fillOpacity={1} fill="url(#colorBooked)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed — real recent leads + AI wins */}
        <Card className="bg-[#0A0F1E] border-white/10 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-white">Live AI Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="flex flex-col">
              {stats.recentLeads.length === 0 && (
                <p className="px-6 py-4 text-sm text-slate-500">No leads yet — once your AI receptionist starts fielding messages, they'll show up here.</p>
              )}
              {stats.recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col gap-1 px-6 py-3 hover:bg-white/[0.02] border-b border-white/5 last:border-0 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{new Date(lead.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${lead.status === "booked" ? "bg-[#FF6B2B]/20 text-[#FF6B2B] border-none" : "bg-white/5 text-slate-300 border-white/10"}`}>
                      {lead.status}
                    </Badge>
                  </div>
                  <p className={`text-sm ${lead.status === "booked" ? "text-white font-medium" : "text-slate-300"}`}>
                    {lead.name}{lead.service ? ` — ${lead.service}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Kanban Preview — real leads grouped by status */}
      <Card className="bg-[#0A0F1E] border-white/10 shadow-xl mt-2">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold text-white">Active Pipeline</CardTitle>
          <a href="/leads"><Badge className="bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 border-none cursor-pointer">View All Leads</Badge></a>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KanbanCol title="New Leads" count={countByStatus("new")} color="bg-blue-500">
              {byStatus("new").map((l) => <LeadCard key={l.id} name={l.name} service={l.service || "—"} time="New" score={scoreLabel(l.score)} />)}
            </KanbanCol>
            <KanbanCol title="Contacted (AI)" count={countByStatus("contacted")} color="bg-orange-500">
              {byStatus("contacted").map((l) => <LeadCard key={l.id} name={l.name} service={l.service || "—"} time="Active" score={scoreLabel(l.score)} />)}
            </KanbanCol>
            <KanbanCol title="Qualified" count={countByStatus("qualified")} color="bg-purple-500">
              {byStatus("qualified").map((l) => <LeadCard key={l.id} name={l.name} service={l.service || "—"} time="Needs Appt" score={scoreLabel(l.score)} />)}
            </KanbanCol>
            <KanbanCol title="Booked" count={countByStatus("booked") + countByStatus("won")} color="bg-green-500">
              {[...byStatus("booked"), ...byStatus("won")].slice(0, 3).map((l) => <LeadCard key={l.id} name={l.name} service={l.service || "—"} time="Confirmed" score="WON" highlight />)}
            </KanbanCol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function scoreLabel(score: number): string {
  if (score >= 75) return "HOT";
  if (score >= 45) return "WARM";
  return "COLD";
}

function MetricCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="bg-[#0A0F1E] border-white/10 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </CardContent>
    </Card>
  );
}

function KanbanCol({ title, count, color, children }: any) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5 h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2">
        {React.Children.count(children) === 0 ? <p className="text-xs text-slate-600 px-1 py-2">None yet</p> : children}
      </div>
    </div>
  );
}

function LeadCard({ name, service, time, score, highlight }: any) {
  const isHot = score === "HOT" || score === "WON";
  return (
    <div className={`bg-[#0A0F1E] p-3 rounded-lg border ${highlight ? "border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-white/10"} hover:border-[#FF6B2B]/50 transition-colors cursor-pointer`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-white">{name}</span>
        <Badge className={`text-[9px] px-1 py-0 h-4 border-none ${isHot ? "bg-[#FF6B2B]/20 text-[#FF6B2B]" : "bg-white/10 text-slate-300"}`}>
          {score}
        </Badge>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">{service}</span>
        <span className="text-slate-500 font-medium">{time}</span>
      </div>
    </div>
  );
}
