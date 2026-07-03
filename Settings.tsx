import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const industries = [
  { name: "HVAC", emoji: "❄️", color: "border-blue-500/30 hover:border-blue-500/60", stat: "$1,250 avg job", desc: "Never miss an emergency AC or heating call again. BurnCall qualifies urgency and books same-day slots before your competitor picks up." },
  { name: "Plumbing", emoji: "🔧", color: "border-cyan-500/30 hover:border-cyan-500/60", stat: "$650 avg job", desc: "From emergency leaks to routine drain cleaning, BurnCall responds instantly and routes emergencies to your on-call team." },
  { name: "Roofing", emoji: "🏠", color: "border-orange-500/30 hover:border-orange-500/60", stat: "$4,500 avg job", desc: "Storm damage leads need immediate response. BurnCall captures storm-surge inquiries 24/7 and books inspection estimates automatically." },
  { name: "Electrical", emoji: "⚡", color: "border-yellow-500/30 hover:border-yellow-500/60", stat: "$2,100 avg job", desc: "Safety-critical electrical inquiries need fast, professional responses. BurnCall qualifies panel upgrades, code violations, and emergency calls." },
  { name: "Cleaning", emoji: "✨", color: "border-green-500/30 hover:border-green-500/60", stat: "$280 avg job", desc: "High volume, repeat customers. BurnCall books recurring cleans automatically and sends follow-up reminders that keep your calendar full." },
  { name: "Landscaping", emoji: "🌿", color: "border-emerald-500/30 hover:border-emerald-500/60", stat: "$800 avg job", desc: "Seasonal demand peaks hit fast. BurnCall handles the spring rush, qualifies by service area, and books estimates without manual effort." },
  { name: "Pest Control", emoji: "🛡️", color: "border-red-500/30 hover:border-red-500/60", stat: "$280 avg job", desc: "Pest infestations feel urgent to homeowners. BurnCall responds immediately, qualifies the infestation type, and schedules inspection visits." },
  { name: "Restoration", emoji: "💧", color: "border-indigo-500/30 hover:border-indigo-500/60", stat: "$8,500 avg job", desc: "Water, fire, and mold damage require immediate response. BurnCall escalates emergencies and helps you capture high-value restoration jobs." },
  { name: "Garage Door", emoji: "🚗", color: "border-slate-400/30 hover:border-slate-400/60", stat: "$450 avg job", desc: "Broken spring? Car trapped? BurnCall handles same-day emergency requests and fills your schedule with repair and installation estimates." },
];

const stats = [
  { value: "3.2X", label: "More Jobs Booked" },
  { value: "65%", label: "Faster Response Rate" },
  { value: "$2,400+", label: "Avg Monthly Revenue Recovered" },
  { value: "4.9/5", label: "Customer Satisfaction" },
];

export default function Industries() {
  return (
    <div className="bg-[#050812] text-white min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">Industries</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Built for home service pros</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">BurnCall is purpose-built for the industries where every missed lead costs real money — and where your competition is already using AI.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0A0F1E] border border-white/10 rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-[#FF6B2B]">{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {industries.map((ind) => (
            <div
              key={ind.name}
              className={`bg-[#0A0F1E] border rounded-2xl p-6 transition-all duration-200 ${ind.color}`}
              data-testid={`industry-${ind.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ind.emoji}</span>
                  <h3 className="text-white font-bold text-lg">{ind.name}</h3>
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{ind.stat}</Badge>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{ind.desc}</p>
              <Link href="/signup">
                <button className="text-[#FF6B2B] text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Get started <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Don't see your industry?</h2>
          <p className="text-slate-400 mb-6">BurnCall works for any local service business. Talk to us and we'll show you exactly how it maps to your workflow.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"><Button className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white px-8 h-12">Start Free Trial</Button></Link>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 h-12">Schedule a Demo Call</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
