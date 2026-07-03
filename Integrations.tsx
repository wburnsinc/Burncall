import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, Trash2, ArrowRight, ArrowLeft, Bot } from "lucide-react";
import logoPath from "@assets/bestlogo_1782311057091.png";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STEPS = ["Business Basics", "Services", "Lead Handling", "AI Training", "Success Target"];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const INDUSTRIES = ["HVAC", "Plumbing", "Electrical", "Roofing", "Cleaning", "Landscaping", "Pest Control", "Restoration", "Garage Door", "Other"];

interface Service { name: string; price: string; questions: string; }
interface FAQ { q: string; a: string; }

export default function Onboarding() {
  const { refresh } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [emergency, setEmergency] = useState(true);
  const [hours, setHours] = useState(DAYS.map((d, i) => ({ day: d, open: i < 5, from: "08:00", to: "17:00" })));

  // Step 2
  const [services, setServices] = useState<Service[]>([
    { name: "AC Repair", price: "From $89 diagnostic", questions: "How old is the unit? What's happening?" },
    { name: "AC Installation", price: "From $3,800", questions: "Square footage? Current system?" },
  ]);
  const [newService, setNewService] = useState<Service>({ name: "", price: "", questions: "" });
  const [addingService, setAddingService] = useState(false);

  // Step 3
  const [channels, setChannels] = useState({ sms: true, email: true, chat: false });
  const [tone, setTone] = useState("professional");
  const [notifyRecipients, setNotifyRecipients] = useState("jason@burkeac.com");
  const [calendarLink, setCalendarLink] = useState("");

  // Step 4
  const [faqs, setFaqs] = useState<FAQ[]>([
    { q: "Do you offer emergency service?", a: "Yes! We provide 24/7 emergency service. Emergency rates may apply." },
    { q: "Do you offer financing?", a: "Yes, we offer 0% financing for 12 months on systems over $2,000." },
  ]);
  const [newFaq, setNewFaq] = useState<FAQ>({ q: "", a: "" });
  const [addingFaq, setAddingFaq] = useState(false);
  const [policies, setPolicies] = useState({
    financeAvailable: true,
    emergencyService: true,
    warranties: true,
    prohibitedClaims: "Never guarantee same-day availability. Do not quote final prices. Do not promise specific technicians.",
  });

  // Step 5
  const [leadTarget, setLeadTarget] = useState("80");
  const [avgJobValue, setAvgJobValue] = useState("1200");
  const [apptTarget, setApptTarget] = useState("20");

  useEffect(() => {
    api
      .get<{ name: string; industry: string; phone: string | null }>("/api/business")
      .then((biz) => {
        if (biz.name) setBusinessName(biz.name);
        if (biz.industry) setIndustry(biz.industry);
        if (biz.phone) setPhone(biz.phone);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishOnboarding = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await api.patch("/api/business", {
        name: businessName,
        industry,
        website,
        phone,
        serviceArea,
        emergencyService: emergency,
        replyTone: tone === "concise" ? "professional" : tone,
        notifyEmails: notifyRecipients,
        calendarLink,
        services,
        faqs,
        monthlyLeadTarget: parseInt(leadTarget) || null,
        avgJobValue: parseInt(avgJobValue) || null,
        apptTarget: parseInt(apptTarget) || null,
        policies: {
          businessHours: hours,
          channels,
          financeAvailable: policies.financeAvailable,
          warranties: policies.warranties,
          aiInstructions: policies.prohibitedClaims ? `Never say or imply the following: ${policies.prohibitedClaims}` : undefined,
        },
        onboardingCompleted: true,
      });
      await refresh();
      setDone(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save your setup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const canNext = () => {
    if (step === 0) return businessName.trim() && industry && phone.trim();
    if (step === 1) return services.length > 0;
    if (step === 2) return Object.values(channels).some(Boolean) && tone;
    if (step === 3) return true;
    if (step === 4) return leadTarget && avgJobValue;
    return true;
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#050812] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-slate-400 mb-2">BurnCall is now configured for <strong className="text-white">{businessName || "your business"}</strong>.</p>
          <p className="text-slate-500 text-sm mb-8">Your AI will start responding to leads immediately. Check your dashboard to see it in action.</p>
          <Link href="/dashboard">
            <Button className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-8 h-12">
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050812] text-white">
      <div className="border-b border-white/10 bg-[#0A0F1E] px-4 py-4">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <img src={logoPath} alt="BurnCall" className="h-7" />
          <div className="text-sm text-slate-400">Step {step + 1} of {STEPS.length}</div>
        </div>
      </div>
      <div className="w-full h-1 bg-white/10">
        <div className="h-full bg-[#FF6B2B] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        {/* Step nav pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${i < step ? "border-green-500/40 bg-green-500/10 text-green-400" : i === step ? "border-[#FF6B2B]/40 bg-[#FF6B2B]/10 text-[#FF6B2B]" : "border-white/10 text-slate-600"}`}>
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Business Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold mb-1">Tell us about your business</h2>
              <p className="text-slate-400 text-sm">This information personalizes your AI's responses to your customers.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Business Name *</label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Burke Air Conditioning" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" data-testid="onboard-business-name" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Industry *</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" data-testid="onboard-industry">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Website</label>
                <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Business Phone *</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(407) 555-0100" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" data-testid="onboard-phone" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1.5 block">Service Area (ZIP codes or city names)</label>
                <Input value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="32789, 32792, Orlando, Winter Park..." className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-3 block">Business Hours</label>
              <div className="space-y-2">
                {hours.map((h, i) => (
                  <div key={h.day} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 w-32 cursor-pointer">
                      <input type="checkbox" checked={h.open} onChange={e => setHours(hrs => hrs.map((x, j) => j === i ? { ...x, open: e.target.checked } : x))} />
                      <span className="text-sm text-white">{h.day.slice(0, 3)}</span>
                    </label>
                    {h.open ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={h.from} onChange={e => setHours(hrs => hrs.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                        <span className="text-slate-500 text-xs">–</span>
                        <input type="time" value={h.to} onChange={e => setHours(hrs => hrs.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                      </div>
                    ) : <span className="text-slate-600 text-sm">Closed</span>}
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={emergency} onChange={e => setEmergency(e.target.checked)} />
              <span className="text-slate-300 text-sm">We offer 24/7 emergency service</span>
            </label>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your services</h2>
              <p className="text-slate-400 text-sm">Add the services you offer. The AI will use this to qualify leads and route requests correctly.</p>
            </div>
            <div className="space-y-3">
              {services.map((svc, i) => (
                <div key={i} className="bg-[#0A0F1E] border border-white/10 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{svc.name}</p>
                    <p className="text-slate-400 text-xs">{svc.price}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Qualify: {svc.questions}</p>
                  </div>
                  <button onClick={() => setServices(s => s.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            {addingService ? (
              <div className="bg-[#0A0F1E] border border-[#FF6B2B]/30 rounded-xl p-4 space-y-3">
                <Input placeholder="Service name (e.g. AC Repair)" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <Input placeholder="Starting price (e.g. From $89, or Request Quote)" value={newService.price} onChange={e => setNewService(s => ({ ...s, price: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <Input placeholder="Qualifying questions (e.g. Age of unit? What's happening?)" value={newService.questions} onChange={e => setNewService(s => ({ ...s, questions: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-xs h-8" onClick={() => {
                    if (newService.name) { setServices(s => [...s, newService]); setNewService({ name: "", price: "", questions: "" }); setAddingService(false); }
                  }}>Add Service</Button>
                  <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-8" onClick={() => setAddingService(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingService(true)} className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-white/40 transition-colors text-sm" data-testid="add-service">
                <Plus className="h-4 w-4" /> Add Service
              </button>
            )}
          </div>
        )}

        {/* Step 3: Lead Handling */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Lead handling preferences</h2>
              <p className="text-slate-400 text-sm">Tell us how you want the AI to respond and who to notify.</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-3 block">Response channels</label>
              <div className="flex gap-3 flex-wrap">
                {(["sms", "email", "chat"] as const).map(ch => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={channels[ch]} onChange={e => setChannels(c => ({ ...c, [ch]: e.target.checked }))} />
                    <span className="text-white text-sm capitalize">{ch === "chat" ? "Web Chat" : ch.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-3 block">AI reply tone</label>
              <div className="space-y-2">
                {[
                  { val: "professional", label: "Professional", desc: "Confident and helpful without being overly casual" },
                  { val: "friendly", label: "Friendly", desc: "Warm and conversational — great for residential" },
                  { val: "concise", label: "Concise", desc: "Short, direct answers — less is more" },
                ].map(t => (
                  <label key={t.val} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-white/10 hover:border-white/20">
                    <input type="radio" name="tone" value={t.val} checked={tone === t.val} onChange={() => setTone(t.val)} className="mt-1" />
                    <div>
                      <p className="text-white text-sm font-medium">{t.label}</p>
                      <p className="text-slate-400 text-xs">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Team notification recipients (comma-separated emails)</label>
              <Input value={notifyRecipients} onChange={e => setNotifyRecipients(e.target.value)} placeholder="owner@company.com, dispatcher@company.com" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" data-testid="onboard-notify" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Booking / calendar link (optional)</label>
              <Input value={calendarLink} onChange={e => setCalendarLink(e.target.value)} placeholder="https://calendly.com/yourlink" className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" />
              <p className="text-slate-600 text-xs mt-1">Qualified leads will receive this link to self-book</p>
            </div>
          </div>
        )}

        {/* Step 4: AI Training */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Train your AI</h2>
              <p className="text-slate-400 text-sm">Add FAQs and policies so the AI always gives accurate, business-approved answers.</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">FAQs</p>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-[#0A0F1E] border border-white/10 rounded-xl p-4 flex gap-3">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{faq.q}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{faq.a}</p>
                    </div>
                    <button onClick={() => setFaqs(f => f.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              {addingFaq ? (
                <div className="mt-3 bg-[#0A0F1E] border border-[#FF6B2B]/30 rounded-xl p-4 space-y-3">
                  <Input placeholder="Question" value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm" />
                  <Textarea placeholder="Answer" value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 text-sm resize-none" rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white text-xs h-8" onClick={() => { if (newFaq.q && newFaq.a) { setFaqs(f => [...f, newFaq]); setNewFaq({ q: "", a: "" }); setAddingFaq(false); } }}>Add FAQ</Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-8" onClick={() => setAddingFaq(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingFaq(true)} className="mt-3 w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white transition-colors text-sm" data-testid="add-faq-onboard">
                  <Plus className="h-4 w-4" /> Add FAQ
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Policies</p>
              <div className="space-y-3">
                {[
                  { key: "financeAvailable", label: "Financing available" },
                  { key: "emergencyService", label: "Emergency service available 24/7" },
                  { key: "warranties", label: "Warranties provided on parts/labor" },
                ].map(p => (
                  <label key={p.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={policies[p.key as keyof typeof policies] as boolean} onChange={e => setPolicies(pp => ({ ...pp, [p.key]: e.target.checked }))} />
                    <span className="text-white text-sm">{p.label}</span>
                  </label>
                ))}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Prohibited claims (the AI will never say these)</label>
                  <Textarea value={policies.prohibitedClaims} onChange={e => setPolicies(p => ({ ...p, prohibitedClaims: e.target.value }))} className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={3} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success Target */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Set your success targets</h2>
              <p className="text-slate-400 text-sm">We'll use these to measure performance and show you revenue rescued vs. target.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Monthly lead target", val: leadTarget, set: setLeadTarget, placeholder: "80", hint: "How many leads do you typically receive per month?" },
                { label: "Average job value ($)", val: avgJobValue, set: setAvgJobValue, placeholder: "1200", hint: "What is your average booked job worth?" },
                { label: "Desired appointments/month", val: apptTarget, set: setApptTarget, placeholder: "20", hint: "How many booked appointments do you want per month?" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{f.label}</label>
                  <Input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="bg-white/5 border-white/10 text-white placeholder:text-slate-600" data-testid={`onboard-${f.label.split(" ")[0].toLowerCase()}`} />
                  <p className="text-slate-600 text-xs mt-1">{f.hint}</p>
                </div>
              ))}
            </div>
            {businessName && avgJobValue && leadTarget && (
              <div className="bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-[#FF6B2B]" />
                  <p className="text-sm text-[#FF6B2B] font-semibold">Your potential revenue opportunity</p>
                </div>
                <p className="text-slate-300 text-sm">
                  At <strong className="text-white">{leadTarget} leads/month</strong> with an average job value of <strong className="text-white">${parseInt(avgJobValue).toLocaleString()}</strong>, capturing even 15% more leads means roughly <strong className="text-green-400">${(Math.round(parseInt(leadTarget) * 0.15) * parseInt(avgJobValue)).toLocaleString()}/month</strong> in additional revenue.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-white/20 text-white hover:bg-white/5">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-6" data-testid={`onboard-next-${step}`}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={finishOnboarding} disabled={saving} className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-8" data-testid="onboard-finish">
              {saving ? "Saving…" : <>Launch BurnCall <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          )}
        </div>
        {saveError && <p className="text-red-400 text-sm mt-3 text-right">{saveError}</p>}
      </div>
    </div>
  );
}
