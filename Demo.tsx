import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Play, Pause, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface ApiAutomation {
  id: number;
  name: string;
  type: string;
  triggerEvent: string;
  enabled: boolean;
  channel: string;
  templateBody: string | null;
  stats: { triggered: number; sent: number; failed: number; opened: number };
}

const TYPE_LABELS: Record<string, string> = {
  instant_response: "Lead Response",
  missed_call: "Lead Response",
  follow_up: "Follow-Up",
  appointment_reminder: "Appointments",
  review_request: "Reviews",
};

export default function Automations() {
  const [automations, setAutomations] = useState<ApiAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: "", triggerEvent: "", templateBody: "", channel: "sms" });
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const data = await api.get<{ automations: ApiAutomation[] }>("/api/automations");
      setAutomations(data.automations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: number, enabled: boolean) => {
    try {
      await api.patch(`/api/automations/${id}`, { enabled: !enabled });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update automation");
    }
  };

  const createAutomation = async () => {
    if (!newAuto.name || !newAuto.triggerEvent) return;
    setCreating(true);
    try {
      await api.post("/api/automations", {
        name: newAuto.name,
        type: "follow_up",
        triggerEvent: newAuto.triggerEvent,
        channel: newAuto.channel,
        templateBody: newAuto.templateBody,
      });
      setNewAuto({ name: "", triggerEvent: "", templateBody: "", channel: "sms" });
      setShowCreate(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create automation");
    } finally {
      setCreating(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(automations.map((a) => TYPE_LABELS[a.type] || a.type)))];
  const filtered = automations.filter((a) => categoryFilter === "All" || (TYPE_LABELS[a.type] || a.type) === categoryFilter);

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading automations…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Automations</h1>
          <p className="text-slate-400 text-sm mt-0.5">{automations.filter((a) => a.enabled).length} active automations</p>
        </div>
        <Button className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white" onClick={() => setShowCreate((s) => !s)}>
          <Zap className="h-4 w-4 mr-2" /> Create Automation
        </Button>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {showCreate && (
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5 mb-5 space-y-3">
          <p className="text-white font-semibold text-sm mb-2">New Automation</p>
          <p className="text-xs text-slate-500">
            Supported triggers today: <code className="text-orange-400">no_reply_24hr</code> (any number of hours) for leads stuck without a reply,
            and <code className="text-orange-400">appointment_reminder_2hr</code> for upcoming appointment reminders. Other trigger text won't fire automatically yet.
          </p>
          <Input placeholder="Name (e.g. 24-Hour Follow-Up)" value={newAuto.name} onChange={(e) => setNewAuto((f) => ({ ...f, name: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
          <Input placeholder="Trigger event — e.g. no_reply_24hr" value={newAuto.triggerEvent} onChange={(e) => setNewAuto((f) => ({ ...f, triggerEvent: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
          <Input placeholder="Message template (use {{customer_name}}, {{business_name}}, {{service}})" value={newAuto.templateBody} onChange={(e) => setNewAuto((f) => ({ ...f, templateBody: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
          <div className="flex gap-2">
            <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white" disabled={creating} onClick={createAutomation}>{creating ? "Creating…" : "Create"}</Button>
            <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${categoryFilter === c ? "bg-[#FF6B2B] text-white border-[#FF6B2B]" : "bg-white/5 text-slate-400 hover:text-white border-white/10"}`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-[#0A0F1E] border border-white/10 rounded-xl">
          <Zap className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>No automations yet — create one to have BurnCall follow up automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((auto) => {
            const isExpanded = expanded === auto.id;
            const completionRate = auto.stats.triggered > 0 ? Math.round((auto.stats.sent / auto.stats.triggered) * 100) : 0;
            const category = TYPE_LABELS[auto.type] || auto.type;

            return (
              <div key={auto.id} className={`bg-[#0A0F1E] border rounded-2xl overflow-hidden transition-all ${auto.enabled ? "border-white/10" : "border-white/5 opacity-70"}`}>
                <div className="flex items-center gap-4 p-5">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${auto.enabled ? "bg-[#FF6B2B]/20" : "bg-white/5"}`}>
                    <Zap className={`h-5 w-5 ${auto.enabled ? "text-[#FF6B2B]" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-semibold text-sm">{auto.name}</p>
                      <Badge className="text-xs bg-white/10 text-slate-400 border-white/10">{category}</Badge>
                      {auto.enabled && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>}
                    </div>
                    <p className="text-slate-400 text-xs truncate">{auto.templateBody || "No message template set"}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    {auto.stats.triggered > 0 && (
                      <>
                        <div className="text-center hidden md:block">
                          <p className="text-white font-semibold">{auto.stats.triggered}</p>
                          <p className="text-slate-500 text-xs">triggered</p>
                        </div>
                        <div className="text-center hidden md:block">
                          <p className="text-green-400 font-semibold">{completionRate}%</p>
                          <p className="text-slate-500 text-xs">sent</p>
                        </div>
                      </>
                    )}
                    <button data-testid={`toggle-automation-${auto.id}`} onClick={() => toggle(auto.id, auto.enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${auto.enabled ? "bg-[#FF6B2B]" : "bg-white/20"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${auto.enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : auto.id)} className="text-slate-400 hover:text-white transition-colors" data-testid={`expand-automation-${auto.id}`}>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-5 bg-white/[0.01]">
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Trigger</p>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Play className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-blue-300 text-xs">{auto.triggerEvent}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Message ({auto.channel})</p>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Pause className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-red-300 text-xs">{auto.templateBody || "Not set"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
