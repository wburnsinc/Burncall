import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Mail, Bot, Send, User } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Message {
  role: "customer" | "ai" | "human";
  content: string;
  ts: string;
}

interface Conversation {
  id: number;
  leadId: number;
  leadName: string;
  channel: string;
  status: string;
  aiHandled: boolean;
  messages: Message[];
  updatedAt: string;
}

const CHANNEL_ICON: Record<string, any> = { sms: MessageSquare, call: Phone, web: Mail, webchat: MessageSquare, email: Mail };
const CHANNEL_COLOR: Record<string, string> = { sms: "text-green-400", call: "text-blue-400", email: "text-purple-400", web: "text-orange-400", webchat: "text-orange-400" };

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function loadConversations() {
    try {
      const data = await api.get<{ conversations: Conversation[] }>("/api/inbox");
      setConversations(data.conversations);
      setSelected((prev) => prev ?? data.conversations[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  const convo = conversations.find((c) => c.id === selected) || null;
  const humanMode = convo ? !convo.aiHandled : false;

  const toggleHuman = async () => {
    if (!convo) return;
    if (!humanMode) {
      // Switching to human mode = taking over the conversation from the AI.
      try {
        await api.post(`/api/inbox/${convo.id}/takeover`, { agentName: "You" });
        await loadConversations();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to take over conversation");
      }
    }
    // Switching back to AI mode isn't wired to a backend toggle yet — the AI
    // resumes automatically on the customer's next inbound message.
  };

  const sendReply = async () => {
    if (!convo || !reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/inbox/${convo.id}/reply`, { content: reply });
      setReply("");
      await loadConversations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading inbox…</div>;
  if (error && conversations.length === 0) return <div className="text-red-400 text-sm p-6">Couldn't load inbox: {error}</div>;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4 -mx-2">
      {/* Conversation list */}
      <div className="w-72 shrink-0 bg-[#0A0F1E] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-slate-500 text-sm">No conversations yet — they'll appear here as soon as your AI receptionist talks to a lead.</p>
          )}
          {conversations.map((c) => {
            const Icon = CHANNEL_ICON[c.channel] || MessageSquare;
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                data-testid={`convo-${c.id}`}
                className={`w-full flex items-start gap-3 p-4 border-b border-white/5 text-left hover:bg-white/[0.02] transition-colors ${selected === c.id ? "bg-[#FF6B2B]/10 border-l-2 border-l-[#FF6B2B]" : ""}`}
              >
                <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold shrink-0">{c.leadName[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-white text-sm font-medium truncate">{c.leadName}</p>
                    <span className="text-slate-500 text-xs shrink-0 ml-2">{timeAgo(c.updatedAt)}</span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">{lastMsg?.content || "No messages yet"}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Icon className={`h-3 w-3 ${CHANNEL_COLOR[c.channel] || "text-slate-400"}`} />
                    <span className="text-slate-600 text-xs">{c.channel.toUpperCase()}</span>
                    {c.status === "needs_human" && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Needs You</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main conversation */}
      <div className="flex-1 bg-[#0A0F1E] border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        {!convo ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select a conversation</div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">{convo.leadName[0]}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{convo.leadName}</p>
                  <Badge className={`text-xs ${convo.status === "needs_human" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/10 text-slate-400 border-white/10"}`}>
                    {convo.status === "needs_human" ? "Needs Review" : convo.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">AI Mode</span>
                <button onClick={toggleHuman} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${humanMode ? "bg-[#FF6B2B]" : "bg-white/20"}`} data-testid="inbox-human-toggle">
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${humanMode ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                </button>
                <span className="text-xs text-slate-400">Human</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {convo.messages.length === 0 && <p className="text-slate-600 text-sm text-center mt-8">No messages yet in this conversation.</p>}
              {convo.messages.map((msg, i) => {
                const isOutbound = msg.role === "ai" || msg.role === "human";
                return (
                  <div key={i} className={`flex gap-2.5 ${isOutbound ? "justify-end" : ""}`}>
                    {!isOutbound && <div className="h-7 w-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">{convo.leadName[0]}</div>}
                    <div className={`max-w-[60%] rounded-2xl p-3 ${isOutbound ? "bg-[#FF6B2B] text-white rounded-tr-sm" : "bg-white/5 text-slate-200 rounded-tl-sm"}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOutbound ? "text-orange-200" : "text-slate-500"}`}>{new Date(msg.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                    {msg.role === "ai" && <div className="h-7 w-7 rounded-full bg-[#FF6B2B]/30 flex items-center justify-center shrink-0 mt-1"><Bot className="h-3.5 w-3.5 text-[#FF6B2B]" /></div>}
                    {msg.role === "human" && <div className="h-7 w-7 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0 mt-1"><User className="h-3.5 w-3.5 text-blue-400" /></div>}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.01]">
              {!humanMode && (
                <p className="text-xs text-slate-500 mb-3">The AI receptionist is handling this conversation. Switch to Human to take over and reply yourself.</p>
              )}
              {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={humanMode ? "Type your message..." : "Switch to Human mode to reply manually"}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
                  disabled={!humanMode || sending}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 disabled:opacity-40 focus:outline-none focus:border-[#FF6B2B]/50"
                  data-testid="inbox-reply-input"
                />
                <Button disabled={!humanMode || sending || !reply.trim()} onClick={sendReply} className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-4 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
