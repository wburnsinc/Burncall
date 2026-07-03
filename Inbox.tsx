import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, X, CalendarPlus } from "lucide-react";
import { api, ApiError, API_BASE } from "@/lib/api";

interface ApiAppointment {
  id: number;
  customerName: string;
  service: string;
  scheduledAt: string;
  duration: number;
  assignedTech: string | null;
  estimatedValue: number | null;
  status: string;
}

const STATUS_LABELS: Record<string, string> = { scheduled: "Confirmed", confirmed: "Confirmed", completed: "Confirmed", cancelled: "Cancelled" };
const STATUS_COLOR: Record<string, string> = {
  Confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function fmtTimeRange(iso: string, durationMin: number) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMin * 60000);
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function Appointments() {
  const [appts, setAppts] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  async function load() {
    try {
      const data = await api.get<{ appointments: ApiAppointment[] }>("/api/appointments");
      setAppts(data.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/api/appointments/${id}`, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update appointment");
    }
  };

  const filters = ["All", "Confirmed", "Pending", "Cancelled"];
  const labeled = appts.map((a) => ({ ...a, label: STATUS_LABELS[a.status] || "Pending" }));
  const filtered = labeled.filter((a) => filter === "All" || a.label === filter);

  // Group by date (chronological), most relevant days first
  const byDate = new Map<string, typeof filtered>();
  for (const a of filtered.sort((x, y) => new Date(x.scheduledAt).getTime() - new Date(y.scheduledAt).getTime())) {
    const key = fmtDate(a.scheduledAt);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(a);
  }

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading appointments…</div>;
  if (error && appts.length === 0) return <div className="text-red-400 text-sm p-6">Couldn't load appointments: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-slate-400 text-sm mt-0.5">{labeled.filter((a) => a.label === "Confirmed").length} confirmed</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === f ? "bg-[#FF6B2B] text-white border-[#FF6B2B]" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"}`}>{f}</button>
        ))}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {byDate.size === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-[#0A0F1E] border border-white/10 rounded-xl">
          <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>No appointments{filter !== "All" ? ` with status "${filter}"` : " yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(byDate.entries()).map(([day, dayAppts]) => {
            const total = dayAppts.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold text-sm">{day}</p>
                  {total > 0 && <span className="text-green-400 text-xs font-medium">${total.toLocaleString()} potential</span>}
                </div>
                <div className="space-y-2">
                  {dayAppts.map((appt) => (
                    <div key={appt.id} className="flex items-center gap-4 bg-[#0A0F1E] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                      <div className="h-10 w-10 rounded-xl bg-[#FF6B2B]/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-[#FF6B2B]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{appt.customerName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span className="text-slate-400 text-xs">{fmtTimeRange(appt.scheduledAt, appt.duration)}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 text-xs">{appt.service}</span>
                        </div>
                      </div>
                      <div className="hidden md:block text-center">
                        <p className="text-slate-400 text-xs">Technician</p>
                        <p className="text-white text-xs font-medium mt-0.5">{appt.assignedTech || "Unassigned"}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-slate-400 text-xs">Est. Value</p>
                        <p className="text-green-400 text-sm font-semibold mt-0.5">{appt.estimatedValue ? `$${appt.estimatedValue.toLocaleString()}` : "—"}</p>
                      </div>
                      <Badge className={`border text-xs ${STATUS_COLOR[appt.label]}`}>{appt.label}</Badge>
                      <a href={`${API_BASE}/api/appointments/${appt.id}/ics`} target="_blank" rel="noreferrer" title="Add to calendar (.ics)">
                        <Button size="sm" variant="outline" className="border-white/20 text-slate-400 h-7 w-7 p-0">
                          <CalendarPlus className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="border-white/20 text-slate-400 h-7 w-7 p-0" onClick={() => updateStatus(appt.id, "completed")} data-testid={`confirm-appt-${appt.id}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/20 text-slate-400 h-7 w-7 p-0" onClick={() => updateStatus(appt.id, "cancelled")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
