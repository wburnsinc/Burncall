import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, Clock, Bell, MessageSquare, Phone } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const TABS = ["Business", "Business Hours", "AI Behavior", "Notifications", "Phone & SMS"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface BusinessHour { day: string; open: boolean; from: string; to: string }
interface NotificationPrefs { newLead: boolean; qualifiedLead: boolean; appointmentBooked: boolean; emergency: boolean; emailDigest: boolean; smsAlerts: boolean }
interface AiRule { label: string; desc: string; enabled: boolean }

interface Policies {
  businessHours?: BusinessHour[];
  notifications?: NotificationPrefs;
  aiRules?: AiRule[];
  smsSettings?: { optOutMessage: string; smsBusinessName: string };
  primaryEmail?: string;
}

interface BusinessData {
  name: string;
  industry: string;
  website: string | null;
  phone: string | null;
  serviceArea: string | null;
  replyTone: string;
  notifyEmails: string | null;
  emergencyService: boolean;
  policies: Policies;
}

const DEFAULT_HOURS: BusinessHour[] = DAYS.map((day, i) => ({ day, open: i < 5, from: "08:00", to: "17:00" }));
const DEFAULT_NOTIFS: NotificationPrefs = { newLead: true, qualifiedLead: true, appointmentBooked: true, emergency: true, emailDigest: true, smsAlerts: false };
const DEFAULT_RULES: AiRule[] = [
  { label: "Auto-respond to all leads", desc: "AI responds to every new lead automatically", enabled: true },
  { label: "Confirm service area before promising availability", desc: "Always check ZIP before offering slots", enabled: true },
  { label: "Never quote prices in chat", desc: "Defer to on-site or a call for pricing", enabled: true },
  { label: "Escalate emergency keywords immediately", desc: "Alert the owner for 'flooding', 'no heat', 'no AC'", enabled: true },
];

export default function Settings() {
  const [tab, setTab] = useState("Business");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BusinessData | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFS);
  const [aiRules, setAiRules] = useState<AiRule[]>(DEFAULT_RULES);

  useEffect(() => {
    api
      .get<BusinessData>("/api/business")
      .then((biz) => {
        setData(biz);
        setHours(biz.policies?.businessHours || DEFAULT_HOURS);
        setNotifications(biz.policies?.notifications || DEFAULT_NOTIFS);
        setAiRules(biz.policies?.aiRules || DEFAULT_RULES);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const field = (key: keyof BusinessData, value: unknown) => setData((d) => (d ? { ...d, [key]: value } : d));
  const policyField = (key: keyof Policies, value: unknown) => setData((d) => (d ? { ...d, policies: { ...d.policies, [key]: value } } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError("");
    try {
      await api.patch("/api/business", {
        name: data.name,
        industry: data.industry,
        website: data.website,
        phone: data.phone,
        serviceArea: data.serviceArea,
        replyTone: data.replyTone,
        notifyEmails: data.notifyEmails,
        emergencyService: data.emergencyService,
        policies: { ...data.policies, businessHours: hours, notifications, aiRules },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading settings…</div>;
  if (!data) return <div className="text-red-400 text-sm p-6">Couldn't load settings: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure your BurnCall account</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white" data-testid="save-settings">
          {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Saved</> : saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? "bg-[#FF6B2B]/20 text-[#FF6B2B]" : "text-slate-400 hover:text-white"}`}>{t}</button>
        ))}
      </div>

      {tab === "Business" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-white font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-[#FF6B2B]" /> Business Information</p>
            <div><label className="text-xs text-slate-400 mb-1.5 block">Business Name</label><Input value={data.name} onChange={(e) => field("name", e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" /></div>
            <div><label className="text-xs text-slate-400 mb-1.5 block">Industry</label><Input value={data.industry} onChange={(e) => field("industry", e.target.value)} placeholder="e.g. HVAC, Plumbing" className="bg-white/5 border-white/10 text-white text-sm" /></div>
            <div><label className="text-xs text-slate-400 mb-1.5 block">Website URL</label><Input value={data.website || ""} onChange={(e) => field("website", e.target.value)} placeholder="https://yoursite.com" className="bg-white/5 border-white/10 text-white text-sm" /></div>
            <div><label className="text-xs text-slate-400 mb-1.5 block">Primary Email</label><Input value={data.policies?.primaryEmail || ""} onChange={(e) => policyField("primaryEmail", e.target.value)} placeholder="your@email.com" className="bg-white/5 border-white/10 text-white text-sm" /></div>
          </div>
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-white font-semibold">Service Area & Phone</p>
            <div><label className="text-xs text-slate-400 mb-1.5 block">Service Area</label><Input value={data.serviceArea || ""} onChange={(e) => field("serviceArea", e.target.value)} placeholder="e.g. Orlando, FL and surrounding areas" className="bg-white/5 border-white/10 text-white text-sm" /></div>
            <div><label className="text-xs text-slate-400 mb-1.5 block">Business Phone</label><Input value={data.phone || ""} onChange={(e) => field("phone", e.target.value)} placeholder="+1..." className="bg-white/5 border-white/10 text-white text-sm" /></div>
            <label className="flex items-center gap-3 cursor-pointer pt-2">
              <input type="checkbox" checked={data.emergencyService} onChange={(e) => field("emergencyService", e.target.checked)} className="rounded border-white/20" />
              <span className="text-sm text-white">Offer emergency service</span>
            </label>
          </div>
        </div>
      )}

      {tab === "Business Hours" && (
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5"><Clock className="h-4 w-4 text-[#FF6B2B]" /><p className="text-white font-semibold">Business Hours</p></div>
          <p className="text-slate-400 text-xs mb-5">BurnCall's AI will indicate availability and after-hours status based on these settings.</p>
          <div className="space-y-3">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-4">
                <div className="w-28">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={h.open} onChange={(e) => setHours((hrs) => hrs.map((x, j) => (j === i ? { ...x, open: e.target.checked } : x)))} className="rounded border-white/20" />
                    <span className="text-sm text-white">{h.day}</span>
                  </label>
                </div>
                {h.open ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={h.from} onChange={(e) => setHours((hrs) => hrs.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                    <span className="text-slate-500 text-xs">to</span>
                    <input type="time" value={h.to} onChange={(e) => setHours((hrs) => hrs.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                  </div>
                ) : (
                  <span className="text-slate-600 text-sm">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "AI Behavior" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 space-y-5">
            <p className="text-white font-semibold">AI Tone</p>
            {["professional", "friendly", "formal"].map((tone) => (
              <label key={tone} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="tone" value={tone} checked={data.replyTone === tone} onChange={() => field("replyTone", tone)} className="border-white/20" />
                <div>
                  <p className="text-white text-sm capitalize">{tone}</p>
                  <p className="text-slate-400 text-xs">{{ professional: "Confident and helpful without being overly casual", friendly: "Warm and conversational — great for residential services", formal: "Strict business language — ideal for commercial clients" }[tone]}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-white font-semibold">AI Rules</p>
            {aiRules.map((rule, i) => (
              <label key={rule.label} className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={rule.enabled} onChange={(e) => setAiRules((rules) => rules.map((r, j) => (j === i ? { ...r, enabled: e.target.checked } : r)))} className="mt-0.5 rounded border-white/20" />
                <div>
                  <p className="text-white text-sm">{rule.label}</p>
                  <p className="text-slate-500 text-xs">{rule.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2"><Bell className="h-4 w-4 text-[#FF6B2B]" /><p className="text-white font-semibold">Notification Preferences</p></div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Alert email(s) — comma-separated, used for real escalation emails</label>
            <Input value={data.notifyEmails || ""} onChange={(e) => field("notifyEmails", e.target.value)} placeholder="you@business.com, manager@business.com" className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          {([
            { key: "newLead", label: "New lead arrives", desc: "Notify when any new lead comes in" },
            { key: "qualifiedLead", label: "Lead qualified (score ≥ 80)", desc: "Notify when a hot lead is identified" },
            { key: "appointmentBooked", label: "Appointment booked", desc: "Notify when a customer books a slot" },
            { key: "emergency", label: "Emergency lead detected", desc: "Always alert immediately for emergencies" },
            { key: "emailDigest", label: "Daily email digest", desc: "Summary of leads and performance each morning" },
            { key: "smsAlerts", label: "SMS alerts (owner phone)", desc: "Text alerts for critical events" },
          ] as const).map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <div><p className="text-white text-sm">{n.label}</p><p className="text-slate-400 text-xs">{n.desc}</p></div>
              <button onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[n.key] ? "bg-[#FF6B2B]" : "bg-white/20"}`} data-testid={`toggle-notif-${n.key}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[n.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "Phone & SMS" && (
        <div className="space-y-5">
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Phone className="h-4 w-4 text-[#FF6B2B]" /><p className="text-white font-semibold">BurnCall Phone Number</p></div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
              <span className="text-2xl font-bold text-white">{data.phone || "Not configured"}</span>
              <Badge className={data.phone ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}>{data.phone ? "Active" : "Not set"}</Badge>
            </div>
            <p className="text-slate-400 text-xs">This must match the Twilio number configured for this business so inbound SMS routes correctly (see the Business tab's phone field, and DEPLOY.md for the Twilio webhook setup).</p>
          </div>
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4 text-[#FF6B2B]" /><p className="text-white font-semibold">SMS Settings</p></div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Opt-out message</label>
              <Input value={data.policies?.smsSettings?.optOutMessage || ""} onChange={(e) => policyField("smsSettings", { ...data.policies?.smsSettings, optOutMessage: e.target.value })} className="bg-white/5 border-white/10 text-white text-sm" placeholder={`Reply STOP to unsubscribe from messages from ${data.name}.`} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Business name in messages</label>
              <Input value={data.policies?.smsSettings?.smsBusinessName || data.name} onChange={(e) => policyField("smsSettings", { ...data.policies?.smsSettings, smsBusinessName: e.target.value })} className="bg-white/5 border-white/10 text-white text-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
