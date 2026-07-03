import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Faq { q: string; a: string }
interface Service { name: string; price: string; questions: string }

interface BusinessData {
  faqs: Faq[];
  services: Service[];
  policies: { aiInstructions?: string; serviceZips?: string[] };
}

const TABS = ["FAQs", "Services", "Service Areas", "AI Instructions"];

export default function KnowledgeBase() {
  const [tab, setTab] = useState("FAQs");
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [addingFaq, setAddingFaq] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  const [addingService, setAddingService] = useState(false);
  const [newSvc, setNewSvc] = useState({ name: "", price: "", questions: "" });

  const [newZip, setNewZip] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");

  const [testQ, setTestQ] = useState("");
  const [testAnswer, setTestAnswer] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api
      .get<BusinessData>("/api/business")
      .then((biz) => {
        setData(biz);
        setAiInstruction(biz.policies?.aiInstructions || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load knowledge base"))
      .finally(() => setLoading(false));
  }, []);

  async function persist(partial: Partial<BusinessData>) {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch<BusinessData>("/api/business", partial);
      setData((d) => (d ? { ...d, ...updated } : d));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const saveFaqs = (faqs: Faq[]) => {
    setData((d) => (d ? { ...d, faqs } : d));
    persist({ faqs });
  };
  const saveServices = (services: Service[]) => {
    setData((d) => (d ? { ...d, services } : d));
    persist({ services });
  };
  const saveZips = (zips: string[]) => {
    setData((d) => (d ? { ...d, policies: { ...d.policies, serviceZips: zips } } : d));
    persist({ policies: { ...data?.policies, serviceZips: zips } } as Partial<BusinessData>);
  };
  const saveAiInstructions = () => {
    setData((d) => (d ? { ...d, policies: { ...d.policies, aiInstructions: aiInstruction } } : d));
    persist({ policies: { ...data?.policies, aiInstructions: aiInstruction } } as Partial<BusinessData>);
  };

  const testAI = async () => {
    if (!testQ.trim()) return;
    setTesting(true);
    setTestAnswer(null);
    try {
      const res = await api.post<{ reply: string }>("/api/ai/test", { message: testQ });
      setTestAnswer(res.reply);
    } catch (err) {
      setTestAnswer(err instanceof ApiError ? `Error: ${err.message}` : "Something went wrong testing the AI.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm p-6">Loading knowledge base…</div>;
  if (!data) return <div className="text-red-400 text-sm p-6">Couldn't load knowledge base: {error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-0.5">Train your AI with your business information{saving && " — saving…"}</p>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-[#FF6B2B]/20 text-[#FF6B2B]" : "text-slate-400 hover:text-white"}`} data-testid={`kb-tab-${t.toLowerCase().replace(/\s+/g, "-")}`}>{t}</button>
        ))}
      </div>

      {tab === "FAQs" && (
        <div className="space-y-3">
          {data.faqs.map((faq, i) => (
            <div key={i} className="bg-[#0A0F1E] border border-white/10 rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <span className="text-white font-medium text-sm">{faq.q}</span>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); saveFaqs(data.faqs.filter((_, j) => j !== i)); }} className="text-slate-600 hover:text-red-400 transition-colors p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  {expandedFaq === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </button>
              {expandedFaq === i && (
                <div className="border-t border-white/5 px-4 pb-4 pt-3">
                  <Textarea defaultValue={faq.a} onBlur={(e) => saveFaqs(data.faqs.map((f, j) => (j === i ? { ...f, a: e.target.value } : f)))} className="bg-white/5 border-white/10 text-slate-300 text-sm resize-none" rows={2} />
                  <p className="text-xs text-slate-600 mt-1">Saves automatically when you click away</p>
                </div>
              )}
            </div>
          ))}
          {addingFaq ? (
            <div className="bg-[#0A0F1E] border border-[#FF6B2B]/30 rounded-xl p-4 space-y-3">
              <Input placeholder="Question" value={newQ} onChange={(e) => setNewQ(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" />
              <Textarea placeholder="Answer" value={newA} onChange={(e) => setNewA(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm resize-none" rows={2} />
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-xs h-8" onClick={() => { if (newQ && newA) { saveFaqs([...data.faqs, { q: newQ, a: newA }]); setNewQ(""); setNewA(""); setAddingFaq(false); } }}>Add FAQ</Button>
                <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-8" onClick={() => setAddingFaq(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingFaq(true)} className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-white/40 transition-colors text-sm" data-testid="add-faq">
              <Plus className="h-4 w-4" /> Add FAQ
            </button>
          )}
          {data.faqs.length === 0 && !addingFaq && <p className="text-center text-slate-600 text-sm py-4">No FAQs yet — add some so the AI can answer accurately instead of guessing.</p>}
        </div>
      )}

      {tab === "Services" && (
        <div className="space-y-3">
          {data.services.map((svc, i) => (
            <div key={i} className="bg-[#0A0F1E] border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-white font-semibold">{svc.name}</p>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs rounded-full px-2 py-0.5">{svc.price}</span>
                  <button onClick={() => saveServices(data.services.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p className="text-slate-400 text-xs">Qualifying questions: {svc.questions}</p>
            </div>
          ))}
          {addingService ? (
            <div className="bg-[#0A0F1E] border border-[#FF6B2B]/30 rounded-xl p-4 space-y-3">
              <Input placeholder="Service name" value={newSvc.name} onChange={(e) => setNewSvc((s) => ({ ...s, name: e.target.value }))} className="bg-white/5 border-white/10 text-white text-sm" />
              <Input placeholder="Price (e.g. From $89 diagnostic)" value={newSvc.price} onChange={(e) => setNewSvc((s) => ({ ...s, price: e.target.value }))} className="bg-white/5 border-white/10 text-white text-sm" />
              <Input placeholder="Qualifying questions the AI should ask" value={newSvc.questions} onChange={(e) => setNewSvc((s) => ({ ...s, questions: e.target.value }))} className="bg-white/5 border-white/10 text-white text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-xs h-8" onClick={() => { if (newSvc.name) { saveServices([...data.services, newSvc]); setNewSvc({ name: "", price: "", questions: "" }); setAddingService(false); } }}>Add Service</Button>
                <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-8" onClick={() => setAddingService(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingService(true)} className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white transition-colors text-sm">
              <Plus className="h-4 w-4" /> Add Service
            </button>
          )}
        </div>
      )}

      {tab === "Service Areas" && (
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6">
          <p className="text-sm font-semibold text-white mb-4">Service ZIP Codes</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(data.policies.serviceZips || []).map((zip) => (
              <span key={zip} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-slate-300 flex items-center gap-1.5">
                {zip} <button onClick={() => saveZips((data.policies.serviceZips || []).filter((z) => z !== zip))} className="text-slate-600 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </span>
            ))}
            {(data.policies.serviceZips || []).length === 0 && <p className="text-slate-600 text-sm">No ZIP codes added yet.</p>}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add ZIP code..." value={newZip} onChange={(e) => setNewZip(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm max-w-xs" />
            <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-xs" onClick={() => { if (newZip.trim()) { saveZips([...(data.policies.serviceZips || []), newZip.trim()]); setNewZip(""); } }}>Add</Button>
          </div>
        </div>
      )}

      {tab === "AI Instructions" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-white mb-3">Custom AI Behavior Instructions</p>
            <Textarea
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              className="bg-[#0A0F1E] border-white/10 text-slate-300 text-sm resize-none min-h-[240px]"
              placeholder="Tell the AI how to behave... e.g. 'Never quote prices on the spot. Always confirm ZIP code before promising service.'"
              data-testid="ai-instructions"
            />
            <p className="text-xs text-slate-500 mt-2">This text is injected directly into the live AI receptionist's system prompt — real leads will see the effect immediately after saving.</p>
            <Button className="mt-3 bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-sm" onClick={saveAiInstructions} disabled={saving}>{saving ? "Saving…" : "Save Instructions"}</Button>
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-3">Test AI Response</p>
            <Input
              placeholder="Ask a question a customer might send..."
              value={testQ}
              onChange={(e) => setTestQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") testAI(); }}
              className="bg-[#0A0F1E] border-white/10 text-white placeholder:text-slate-600 text-sm mb-3"
              data-testid="test-ai-input"
            />
            <Button onClick={testAI} className="w-full bg-white/10 hover:bg-white/20 text-white text-sm mb-4" disabled={!testQ || testing}>
              <Bot className="h-4 w-4 mr-2" /> {testing ? "Asking Claude…" : "Test AI Response"}
            </Button>
            <p className="text-xs text-slate-500 mb-4">This calls your live Anthropic API key with your real services/FAQs/tone — it doesn't create a lead or send any notifications.</p>
            {testAnswer && (
              <div className="bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-[#FF6B2B]" />
                  <span className="text-xs text-[#FF6B2B] font-semibold">AI Response</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{testAnswer}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
