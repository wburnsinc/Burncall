import React, { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MessageSquare, ArrowLeft, Calendar, DollarSign, Tag, Send, Bot, User } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  channel: string;
  status: string;
  score: number;
  service: string | null;
  urgency: string | null;
  estimatedValue: number | null;
  aiResponseTime: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
}

interface Appointment { id: number; scheduledAt: string; duration: number; status: string }
interface Message { role: "customer" | "ai" | "human"; content: string; ts: string }
interface Conversation { id: number; leadId: number; channel: string; status: string; aiHandled: boolean; messages: Message[] }

const STATUS_LABELS: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", booked: "Appointment Booked", won: "Won", lost: "Lost" };
const SCORE_LABEL = (s: number) => (s >= 80 ? "HOT" : s >= 50 ? "WARM" : "COLD");
const SCORE_COLOR = (s: number) => (s >= 80 ? "text-green-400 border-green-400" : s >= 50 ? "text-yellow-400 border-yellow-400" : "text-red-400 border-red-400");

export default function LeadDetail() {
  const [, params] = useRoute("/leads/:id");
  const leadId = params?.id ? Number(params.id) : null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [convo, setConvo] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    if (!leadId) return;
    try {
      const [l, appts, inbox] = await Promise.all([
        api.get<Lead>(`/api/leads/${leadId}`),
        api.get<{ appointments: Appointment[] & { leadId?: number }[] }>("/api/appointments"),
        api.get<{ conversations: (Conversation & { leadId: number })[] }>("/api/inbox"),
      ]);
      setLead(l);
      setNote(l.notes || "");
      const matchedAppt = (appts.appointments as any[]).find((a) => a.leadId === leadId);
      setAppointment(matchedAppt || null);
      const matchedConvo = inbox.conversations.find((c) => c.leadId === leadId);
      setConvo(matchedConvo || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const updateStatus = async (status: string) => {
    if (!lead) return;
    try {
      const updated = await api.patch<Lead>(`/api/leads/${lead.id}`, { status });
      setLead(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update lead");
    }
  };

  const saveNote = async () => {
    if (!lead) return;
    setSavingNote(true);
    try {
      const updated = await api.patch<Lead>(`/api/leads/${lead.id}`, { notes: note });
      setLead(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const takeOver = async () => {
    if (!convo) return;
    try {
      await api.post(`/api/inbox/${convo.id}/takeover`, { agentName: "You" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to take over conversation");
    }
  };

  const sendReply = async () => {
    if (!convo || !message.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/inbox/${convo.id}/reply`, { content: message });
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading lead…</div>;
  if (!lead) return <div className="text-red-400 text-sm p-6">Couldn't load lead: {error}</div>;

  const humanMode = convo ? !convo.aiHandled : false;

  // Real timeline derived from actual timestamps we have — no fabricated events.
  const timeline: { time: string; event: string; color: string }[] = [
    { time: new Date(lead.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), event: `Lead submitted via ${lead.source}`, color: "text-blue-400" },
  ];
  if (lead.aiResponseTime) timeline.push({ time: "", event: `AI responded in ${lead.aiResponseTime}s`, color: "text-[#FF6B2B]" });
  if (["qualified", "booked", "won"].includes(lead.status)) timeline.push({ time: "", event: `Lead qualified — Score: ${lead.score}`, color: "text-green-400" });
  if (appointment) timeline.push({ time: new Date(appointment.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), event: "Appointment booked", color: "text-green-400" });
  if (lead.status === "won") timeline.push({ time: new Date(lead.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), event: "Marked as Won", color: "text-green-400" });
  if (lead.status === "lost") timeline.push({ time: new Date(lead.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), event: "Marked as Lost", color: "text-red-400" });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads">
          <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </button>
        </Link>
      </div>
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF6B2B] to-orange-600 flex items-center justify-center text-white font-bold text-lg">{lead.name[0]}</div>
                <div>
                  <h2 className="text-white font-bold">{lead.name}</h2>
                  <p className="text-slate-400 text-xs">Lead #{lead.id} · {lead.source}</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">{STATUS_LABELS[lead.status] || lead.status}</Badge>
            </div>
            <div className="space-y-2.5 text-sm">
              {lead.phone && <div className="flex items-center gap-2.5 text-slate-300"><Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" /><span>{lead.phone}</span></div>}
              {lead.email && <div className="flex items-center gap-2.5 text-slate-300"><Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" /><span>{lead.email}</span></div>}
              {lead.service && <div className="flex items-center gap-2.5 text-slate-300"><Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" /><span>{lead.service}{lead.urgency ? ` · ${lead.urgency}` : ""}</span></div>}
              {lead.estimatedValue != null && <div className="flex items-center gap-2.5 text-slate-300"><DollarSign className="h-3.5 w-3.5 text-slate-500 shrink-0" /><span className="text-green-400 font-semibold">${lead.estimatedValue.toLocaleString()} est. value</span></div>}
            </div>
          </div>

          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">AI Lead Score</p>
              <Badge className={`${SCORE_COLOR(lead.score)} bg-transparent border`}>{SCORE_LABEL(lead.score)}</Badge>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`h-16 w-16 rounded-full border-4 ${SCORE_COLOR(lead.score)} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{lead.score}</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-white/10 rounded-full h-2 mb-1"><div className={`h-2 rounded-full ${SCORE_COLOR(lead.score).split(" ")[0].replace("text-", "bg-")}`} style={{ width: `${lead.score}%` }} /></div>
                <p className="text-xs text-slate-400">Score out of 100 — set by the AI via qualify_lead</p>
              </div>
            </div>
          </div>

          {appointment && (
            <div className="bg-[#0A0F1E] border border-[#FF6B2B]/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Calendar className="h-4 w-4 text-[#FF6B2B]" /><p className="text-sm font-semibold text-white">Appointment Booked</p></div>
              <p className="text-white font-medium text-sm">{new Date(appointment.scheduledAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              <p className="text-slate-400 text-xs">{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
            </div>
          )}

          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">Internal Notes</p>
            <Textarea placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm min-h-[80px] resize-none" data-testid="lead-notes" />
            <Button size="sm" className="mt-2 bg-white/10 hover:bg-white/20 text-white text-xs" onClick={saveNote} disabled={savingNote}>{savingNote ? "Saving…" : "Save Note"}</Button>
          </div>

          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Actions</p>
            <Button className="w-full bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-sm h-9" data-testid="mark-won" onClick={() => updateStatus("won")}>Mark as Won</Button>
            {convo && !humanMode && <Button variant="outline" className="w-full border-white/20 text-white text-sm h-9" data-testid="take-over" onClick={takeOver}>Take Over Conversation</Button>}
            {lead.phone && <a href={`tel:${lead.phone}`}><Button variant="outline" className="w-full border-white/20 text-white text-sm h-9"><Phone className="h-3.5 w-3.5 mr-2" /> Call Lead</Button></a>}
            <Button variant="outline" className="w-full border-red-500/30 text-red-400 text-sm h-9" onClick={() => updateStatus("lost")}>Mark as Lost</Button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-white">Conversation</p>
                {convo && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{convo.channel.toUpperCase()}</Badge>}
              </div>
              {convo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">AI Mode</span>
                  <button onClick={takeOver} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${humanMode ? "bg-[#FF6B2B]" : "bg-white/20"}`} data-testid="human-takeover">
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${humanMode ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-xs text-slate-400">Human</span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {!convo || convo.messages.length === 0 ? (
                <p className="text-slate-600 text-sm text-center py-6">No conversation yet for this lead.</p>
              ) : (
                convo.messages.map((msg, i) => {
                  const isOutbound = msg.role === "ai" || msg.role === "human";
                  return (
                    <div key={i} className={`flex gap-2.5 ${isOutbound ? "justify-end" : ""}`}>
                      {!isOutbound && <div className="h-7 w-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">{lead.name[0]}</div>}
                      <div className={`max-w-[70%] rounded-2xl p-3 ${isOutbound ? "bg-[#FF6B2B] text-white rounded-tr-sm" : "bg-white/5 text-slate-200 rounded-tl-sm"}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1.5 ${isOutbound ? "text-orange-200" : "text-slate-500"}`}>{new Date(msg.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                      {msg.role === "ai" && <div className="h-7 w-7 rounded-full bg-[#FF6B2B]/30 flex items-center justify-center shrink-0 mt-1"><Bot className="h-3.5 w-3.5 text-[#FF6B2B]" /></div>}
                      {msg.role === "human" && <div className="h-7 w-7 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0 mt-1"><User className="h-3.5 w-3.5 text-blue-400" /></div>}
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input type="text" placeholder={humanMode ? "Type a message..." : "AI is handling this conversation"} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }} disabled={!humanMode || sending} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 disabled:opacity-50 focus:outline-none focus:border-[#FF6B2B]/50" data-testid="message-input" />
                <Button size="sm" disabled={!humanMode || sending || !message.trim()} onClick={sendReply} className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-4 rounded-xl"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Timeline</p>
            <div className="space-y-3">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full mt-1.5 ${item.color.replace("text-", "bg-")}`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-slate-200 text-sm">{item.event}</p>
                    {item.time && <p className="text-slate-500 text-xs mt-0.5">{item.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
