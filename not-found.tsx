import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, PhoneMissed, Zap, MessageSquare, Calendar, TrendingUp,
  Star, Users, Bell, FileText, ShieldCheck, Globe2, Bot, ArrowRight,
  Clock, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const FEATURES = [
  { icon: Zap, title: "Instant Lead Response", desc: "Every web inquiry gets an AI reply in under 60 seconds, 24 hours a day." },
  { icon: Bot, title: "AI Lead Qualification", desc: "Our AI asks the right questions — ZIP, service type, urgency — before you talk to anyone." },
  { icon: PhoneMissed, title: "Missed-Call Text Back", desc: "When you can't answer, we instantly text the caller to keep the lead warm." },
  { icon: Clock, title: "Automated Follow-Up", desc: "Leads that go quiet get automatic follow-ups at 1 hour and 24 hours." },
  { icon: Calendar, title: "Appointment Booking", desc: "Qualified leads receive your scheduling link or are routed to your team." },
  { icon: Users, title: "Human Handoff", desc: "One click lets your team take over any AI conversation seamlessly." },
  { icon: TrendingUp, title: "Revenue Dashboard", desc: "See exactly how much revenue BurnCall is recovering for you in real time." },
  { icon: Bell, title: "Team Notifications", desc: "Your team is alerted instantly for high-urgency leads, emergencies, and bookings." },
  { icon: MessageSquare, title: "Conversation Summaries", desc: "Every AI conversation is summarized so your team never has to read the whole thread." },
  { icon: FileText, title: "Business Knowledge Base", desc: "Train the AI with your FAQs, pricing, and service area — it answers what you would." },
  { icon: ShieldCheck, title: "Spam Detection", desc: "AI filters junk before it reaches your team so you only deal with real leads." },
  { icon: Globe2, title: "Multi-Location Support", desc: "Run one BurnCall account across multiple business locations with separate routing." },
];

const TESTIMONIALS = [
  { quote: "We started booking estimates from leads that used to go cold after hours. It pays for itself every month.", name: "Jason B.", role: "HVAC Business Owner", location: "Orlando, FL" },
  { quote: "The missed-call text back alone paid for the platform. We used to lose 3–4 jobs a week just from not picking up.", name: "Maria T.", role: "Plumbing Company Owner", location: "Tampa, FL" },
  { quote: "It feels like having a receptionist who never sleeps. Every lead gets an answer, and I can focus on the work.", name: "Derek R.", role: "Electrical Contractor", location: "Jacksonville, FL" },
];

const PROBLEM_CARDS = [
  { icon: PhoneMissed, title: "Missed Calls", desc: "A prospect calls while your team is busy on a job. They don't leave a voicemail. You lose the lead." },
  { icon: Clock, title: "Slow Follow-Up", desc: "The lead submits a form and waits hours for a response. By then, they've already booked a competitor." },
  { icon: AlertCircle, title: "Leads That Disappear", desc: "No one follows up after the first unanswered message. The opportunity quietly disappears." },
];

const SOLUTION_STEPS = [
  { num: "01", title: "Capture", desc: "BurnCall receives leads from your website, forms, missed calls, SMS, and inbox." },
  { num: "02", title: "Respond", desc: "A personalized reply goes out in under 60 seconds — even at 2AM." },
  { num: "03", title: "Qualify", desc: "AI asks the right questions and filters low-quality or out-of-area inquiries." },
  { num: "04", title: "Book", desc: "Qualified customers receive your scheduling link or are routed directly to your team." },
];

export default function Home() {
  const [leads, setLeads] = React.useState(80);
  const [jobValue, setJobValue] = React.useState(1200);
  const [closeRate, setCloseRate] = React.useState(25);
  const [improvement, setImprovement] = React.useState(15);

  const revenueAtRisk = Math.round(leads * jobValue * (closeRate / 100) * 0.3);
  const additionalJobs = Math.round(leads * (improvement / 100));
  const recoveredRevenue = additionalJobs * jobValue;

  return (
    <div className="flex flex-col w-full bg-[#050812] overflow-hidden">

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B2B]/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[300px] bg-[#3B82F6]/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <Badge className="mb-6 bg-white/5 text-[#FF6B2B] border-[#FF6B2B]/30 px-3 py-1 text-sm">
            Every lead answered in under 60 seconds
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
            Stop losing leads<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2B] to-[#FF8C5A]">
              {" "}while you're on the job.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            BurnCall replies to every new inquiry in seconds, qualifies the customer, follows up automatically, and gets more estimates onto your calendar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white border-none h-14 px-8 text-lg w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 h-14 px-8 text-lg w-full sm:w-auto">
                Watch Interactive Demo
              </Button>
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-4">Built for HVAC, plumbing, roofing, electrical, cleaning, and local service teams.</p>

          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 text-slate-400 text-sm font-medium">
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-bold text-white">3.2x</span>
              <span>More Jobs Booked</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-bold text-white">14s</span>
              <span>Avg AI Response Time</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-bold text-[#FF6B2B]">$2,400+</span>
              <span>Avg Revenue Recovered/mo</span>
            </div>
          </div>
        </div>
      </section>

      {/* App Mockup Preview */}
      <section className="container mx-auto px-4 md:px-6 -mt-16 mb-24 relative z-20">
        <div className="rounded-xl border border-white/10 bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="p-6 md:w-1/3 border-r border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-[#FF6B2B]/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#FF6B2B]" />
              </div>
              <div>
                <h3 className="font-semibold text-white">New Lead Generated</h3>
                <p className="text-xs text-slate-400">Just now — From Website</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm font-medium text-white mb-1">Sarah M.</p>
                <p className="text-xs text-slate-400 mb-2">"AC is running but blowing warm air."</p>
                <Badge className="bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/20 border-none text-xs">HVAC Repair</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span className="text-xs text-slate-300">AI responded in <strong className="text-[#FF6B2B]">14 seconds</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span className="text-xs text-slate-300">Lead qualified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span className="text-xs text-slate-300">Appointment booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span className="text-xs text-green-400 font-medium">+$1,250 estimated job value</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 md:w-2/3 bg-[#0A0F1E]">
            <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Live AI Conversation</h4>
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm text-white">Hi, my AC is blowing warm air. Can someone come today?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#FF6B2B] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm text-white">Hi Sarah — sorry you're dealing with that. We may be able to help today. Is the system completely off, or is it running but blowing warm air?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm text-white">It's running but blowing warm.</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/30 rounded-lg p-4 w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-[#3B82F6]" />
                    <div>
                      <p className="text-sm font-semibold text-white">Appointment Confirmed</p>
                      <p className="text-xs text-[#3B82F6]">Today at 2:00 PM — John T.</p>
                    </div>
                  </div>
                  <Badge className="bg-[#10B981]/20 text-[#10B981] border-none text-xs">+$1,250</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-[#0A0F1E] border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Most local businesses don't lose to competitors.</h2>
            <p className="text-2xl md:text-3xl font-bold text-[#FF6B2B] mb-4">They lose to silence.</p>
            <p className="text-slate-400 max-w-2xl mx-auto">Customers reach out when they need help. If you don't respond fast, they move on.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PROBLEM_CARDS.map((card) => (
              <div key={card.title} className="bg-[#050812] border border-white/10 rounded-2xl p-6">
                <card.icon className="h-8 w-8 text-[#FF6B2B] mb-4" />
                <h3 className="text-white font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-[#050812]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Your 24/7 lead response team.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">BurnCall handles the entire lead journey — from first contact to booked appointment.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {SOLUTION_STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < SOLUTION_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#FF6B2B]/40 to-transparent z-0" />
                )}
                <div className="relative bg-[#0A0F1E] border border-white/10 rounded-2xl p-5 text-center hover:border-[#FF6B2B]/30 transition-colors">
                  <div className="text-4xl font-black text-[#FF6B2B]/20 mb-2">{step.num}</div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — 12 cards */}
      <section className="py-24 bg-[#0A0F1E] border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to capture every lead.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Stop letting leads slip through the cracks. BurnCall automates the entire lead response and follow-up process.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-white/5 border-white/10 hover:border-[#FF6B2B]/40 transition-colors group">
                <CardContent className="p-5">
                  <f.icon className="h-7 w-7 text-[#FF6B2B] mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-24 bg-[#050812]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#0A0F1E] to-[#121A2F] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Calculate Your Lost Revenue</h2>
              <p className="text-slate-400">See how much revenue is slipping through the cracks every month.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-7">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-white text-sm">Leads per Month</Label>
                    <span className="text-[#FF6B2B] font-bold">{leads}</span>
                  </div>
                  <Slider value={[leads]} onValueChange={(val) => setLeads(val[0])} max={500} min={10} step={5} className="[&_[role=slider]]:bg-[#FF6B2B] [&_[role=slider]]:border-none" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-white text-sm">Average Job Value</Label>
                    <span className="text-[#FF6B2B] font-bold">${jobValue.toLocaleString()}</span>
                  </div>
                  <Slider value={[jobValue]} onValueChange={(val) => setJobValue(val[0])} max={10000} min={100} step={100} className="[&_[role=slider]]:bg-[#FF6B2B] [&_[role=slider]]:border-none" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-white text-sm">Current Close Rate</Label>
                    <span className="text-[#FF6B2B] font-bold">{closeRate}%</span>
                  </div>
                  <Slider value={[closeRate]} onValueChange={(val) => setCloseRate(val[0])} max={80} min={5} step={5} className="[&_[role=slider]]:bg-[#FF6B2B] [&_[role=slider]]:border-none" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-white text-sm">Expected Improvement</Label>
                    <span className="text-[#FF6B2B] font-bold">{improvement}%</span>
                  </div>
                  <Slider value={[improvement]} onValueChange={(val) => setImprovement(val[0])} max={50} min={5} step={5} className="[&_[role=slider]]:bg-[#FF6B2B] [&_[role=slider]]:border-none" />
                </div>
              </div>
              <div className="bg-[#050812] rounded-xl p-6 border border-white/5 flex flex-col justify-center space-y-5">
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Monthly Revenue At Risk</p>
                  <p className="text-3xl font-bold text-white">${revenueAtRisk.toLocaleString()}</p>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Additional Jobs Captured</p>
                  <p className="text-2xl font-bold text-white">{additionalJobs} jobs</p>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="text-center">
                  <p className="text-xs text-[#FF6B2B] font-semibold uppercase tracking-wider mb-1">Estimated Recovered Revenue</p>
                  <p className="text-5xl font-bold text-[#FF6B2B]">${recoveredRevenue.toLocaleString()}<span className="text-base text-slate-400">/mo</span></p>
                </div>
                <Link href="/signup">
                  <Button className="w-full bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white font-semibold h-11">
                    See Your Lead Rescue Plan <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#0A0F1E] border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">What service businesses say</h2>
            <p className="text-slate-500 text-sm">Illustrative results from home-service businesses using AI lead response.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#050812] border border-white/10 rounded-2xl p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => <Star key={s} className="h-4 w-4 fill-[#FF6B2B] text-[#FF6B2B]" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role} — {t.location}</p>
                </div>
                <Badge className="mt-3 self-start bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">Demo Testimonial</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#050812]">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to stop losing leads?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">Join home-service businesses using BurnCall to answer every lead, recover missed calls, and book more jobs — automatically.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white h-13 px-8 text-lg">
                Start Free Trial — 14 Days Free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 h-13 px-8 text-lg">
                Watch Interactive Demo
              </Button>
            </Link>
          </div>
          <p className="text-slate-600 text-sm mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
}
