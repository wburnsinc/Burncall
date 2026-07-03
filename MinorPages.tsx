import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthly: 149,
    annual: 119,
    description: "Perfect for solo operators just getting started with AI lead response.",
    features: [
      "1 location",
      "Up to 100 leads/month",
      "Instant web lead response",
      "AI lead qualification",
      "Email notifications",
      "Basic reporting dashboard",
      "Business hours configuration",
      "Email support",
    ],
    missing: ["SMS automation", "Missed-call text back", "Calendar booking", "Team inbox", "CRM integrations", "API access"],
    cta: "Start Free Trial",
    popular: false,
    color: "border-white/10",
  },
  {
    name: "Growth",
    monthly: 299,
    annual: 239,
    description: "The go-to plan for growing home service teams who want to dominate their market.",
    features: [
      "Up to 3 locations",
      "Up to 500 leads/month",
      "SMS & email automation",
      "Missed-call text back",
      "Calendar booking integration",
      "Advanced follow-up sequences",
      "Shared team inbox",
      "Revenue reporting",
      "Up to 3 team members",
      "Priority email support",
    ],
    missing: ["Custom AI playbooks", "CRM integrations", "API access", "White-glove onboarding"],
    cta: "Start Free Trial",
    popular: true,
    color: "border-[#FF6B2B]",
  },
  {
    name: "Pro",
    monthly: 499,
    annual: 399,
    description: "For multi-location operations and franchises that need maximum scale.",
    features: [
      "Unlimited locations",
      "Up to 2,000 leads/month",
      "Custom AI playbooks",
      "Priority phone support",
      "HubSpot, Jobber, ServiceTitan integrations",
      "Full API access",
      "White-glove onboarding",
      "Unlimited team members",
      "Advanced analytics & exports",
      "Dedicated account manager",
    ],
    missing: [],
    cta: "Talk to Sales",
    popular: false,
    color: "border-white/10",
  },
];

const faqs = [
  {
    q: "Is there really no credit card required for the trial?",
    a: "Correct. You get 14 full days to try BurnCall with real leads. No credit card, no commitment. We'll remind you before the trial ends.",
  },
  {
    q: "What counts as a 'lead'?",
    a: "Any inbound contact that BurnCall receives and processes — web form submissions, missed call text-backs, SMS inquiries, and email leads. Spam detected by our AI does not count toward your limit.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. You can upgrade or downgrade your plan at any time from the billing page. Upgrades take effect immediately; downgrades apply at the next billing cycle.",
  },
  {
    q: "Does BurnCall replace my receptionist?",
    a: "BurnCall handles all inbound leads instantly, 24/7. It qualifies prospects, follows up, and books appointments. Your team can take over any conversation at any time with one click.",
  },
  {
    q: "How does the annual discount work?",
    a: "Choosing annual billing saves you 20% compared to month-to-month. You're billed once per year. You can cancel before renewal for a prorated refund.",
  },
  {
    q: "What integrations are supported?",
    a: "BurnCall connects with Google Calendar, Calendly, Twilio, Gmail, Outlook, HubSpot, Jobber, ServiceTitan, Housecall Pro, Zapier, and more. Webhook support is available on all plans.",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#050812] text-white min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-slate-400 text-lg">14-day free trial. No credit card required.</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button
              data-testid="billing-toggle"
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? "bg-[#FF6B2B]" : "bg-white/20"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-white" : "text-slate-500"}`}>
              Annual <Badge className="ml-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs">Save 20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${plan.color} bg-[#0A0F1E] p-8`}
              data-testid={`plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#FF6B2B] text-white border-none px-4 py-1">Most Popular</Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-[#FF6B2B]">${annual ? plan.annual : plan.monthly}</span>
                  <span className="text-slate-400 mb-1">/mo</span>
                </div>
                {annual && (
                  <p className="text-xs text-green-400 mt-1">Billed annually — ${plan.annual * 12}/yr</p>
                )}
              </div>

              <Link href="/signup" className="block mb-6">
                <Button
                  className={`w-full h-11 font-semibold ${plan.popular ? "bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white" : "bg-white/10 hover:bg-white/20 text-white border-white/20"}`}
                  data-testid={`cta-${plan.name.toLowerCase()}`}
                >
                  {plan.cta}
                </Button>
              </Link>

              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">What's included</p>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-slate-200">{f}</span>
                    </li>
                  ))}
                  {plan.missing.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <X className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                      <span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-16 p-8 rounded-2xl bg-[#FF6B2B]/10 border border-[#FF6B2B]/20">
          <h3 className="text-xl font-bold mb-2">Not sure which plan is right for you?</h3>
          <p className="text-slate-400 mb-4 text-sm">Talk to a BurnCall specialist. We'll help you find the right fit for your business.</p>
          <Button variant="outline" className="border-[#FF6B2B] text-[#FF6B2B] hover:bg-[#FF6B2B]/10">
            Schedule a Call
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#0A0F1E] border border-white/10 rounded-xl overflow-hidden">
                <button
                  data-testid={`faq-${i}`}
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <span className="text-slate-400 text-lg ml-4">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
