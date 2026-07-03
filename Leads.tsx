import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Star, Calendar, TrendingUp, CheckCircle2, Zap, Bot, Bell } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Phone,
    title: "Capture Every Lead",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    description: "BurnCall connects to all your lead sources — website forms, phone calls, SMS texts, Facebook leads, and email — so nothing slips through.",
    details: ["Website form embed", "Missed-call text back", "Twilio SMS integration", "Facebook Lead Ads", "Email inbox monitoring"],
  },
  {
    number: "02",
    icon: Bot,
    title: "AI Responds in Under 60 Seconds",
    color: "text-[#FF6B2B]",
    bg: "bg-orange-500/10 border-orange-500/20",
    description: "The moment a lead comes in, BurnCall's AI sends a personalized, professional reply. Available 24/7, including nights and weekends.",
    details: ["Personalized to the service requested", "Tone matched to your brand", "Works nights, weekends, holidays", "Responds via SMS, email, or chat"],
  },
  {
    number: "03",
    icon: Star,
    title: "Qualify Automatically",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    description: "The AI asks the right questions — service area, urgency, homeowner status, budget signals — and scores the lead from 0 to 100.",
    details: ["10-point AI scoring model", "Spam detection built in", "Emergency escalation alerts", "Custom qualifying questions per service"],
  },
  {
    number: "04",
    icon: Calendar,
    title: "Book the Appointment",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    description: "Qualified leads get a direct booking link to your calendar. They pick a time — appointment confirmed, reminders sent automatically.",
    details: ["Google Calendar & Calendly integration", "Real-time availability", "SMS + email confirmations", "Automated day-before reminders"],
  },
  {
    number: "05",
    icon: TrendingUp,
    title: "Grow Your Revenue",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    description: "Every saved lead is tracked in your revenue dashboard. See exactly how much BurnCall is worth to your business each month.",
    details: ["Revenue rescued tracking", "Lead source analytics", "Conversion funnel reporting", "Monthly performance summaries"],
  },
];

const integrations = [
  "Google Calendar", "Twilio", "Calendly", "HubSpot", "Jobber", "ServiceTitan",
  "Gmail", "Facebook Leads", "Zapier", "Webhooks", "Housecall Pro", "Outlook",
];

export default function HowItWorks() {
  return (
    <div className="bg-[#050812] text-white min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">How It Works</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">From missed call to booked job</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">BurnCall handles your lead pipeline end-to-end — capture, qualify, follow up, book. Your team focuses on doing great work, not chasing leads.</p>
        </div>

        <div className="space-y-6 mb-20">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className={`flex gap-6 p-6 rounded-2xl border bg-[#0A0F1E] ${step.bg}`}>
                <div className="shrink-0">
                  <div className="text-5xl font-black text-white/5 leading-none">{step.number}</div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center -mt-3 ${step.bg}`}>
                    <Icon className={`h-6 w-6 ${step.color}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${step.color} mb-2`}>{step.title}</h3>
                  <p className="text-slate-300 mb-4 leading-relaxed">{step.description}</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {step.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle2 className={`h-4 w-4 ${step.color} shrink-0`} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Live Lead Demo</h2>
          <p className="text-slate-400 text-center mb-8 text-sm">Here's the actual AI conversation sequence BurnCall runs when a new lead arrives</p>
          <div className="max-w-md mx-auto space-y-3">
            {[
              { from: "Sarah", msg: "Hi, my AC is blowing warm air. Can someone come today?", ai: false },
              { from: "BurnCall AI", msg: "Hi Sarah — sorry to hear that! We may be able to help today. Is the system off, or blowing warm air?", ai: true },
              { from: "Sarah", msg: "It's running but blowing warm air.", ai: false },
              { from: "BurnCall AI", msg: "Got it. What's your ZIP code so I can confirm service area?", ai: true },
              { from: "Sarah", msg: "32789 — and I'm the homeowner", ai: false },
              { from: "BurnCall AI", msg: "We cover your area! I'm sending you a booking link right now. Score: 92/100 — Hot Lead.", ai: true },
            ].map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.ai ? "justify-end" : ""}`}>
                {!m.ai && <div className="h-6 w-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">S</div>}
                <div className={`max-w-[75%] rounded-2xl p-3 text-xs ${m.ai ? "bg-[#FF6B2B] text-white rounded-tr-sm" : "bg-white/5 text-slate-200 rounded-tl-sm"}`}>
                  {m.msg}
                </div>
                {m.ai && <div className="h-6 w-6 rounded-full bg-[#FF6B2B]/30 flex items-center justify-center shrink-0 mt-1"><Bot className="h-3 w-3 text-[#FF6B2B]" /></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Works with your existing tools</h2>
          <p className="text-slate-400 text-center mb-8 text-sm">BurnCall integrates with the software you already use</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {integrations.map(name => (
              <div key={name} className="bg-[#0A0F1E] border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300">{name}</div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to stop losing leads?</h2>
          <p className="text-slate-400 mb-6">Start your 14-day free trial. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"><Button className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-8 h-12">Start Free Trial</Button></Link>
            <Link href="/demo"><Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 h-12">See Interactive Demo</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
