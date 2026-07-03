import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { api, ApiError } from "@/lib/api";

// Fallback plan definitions shown while Stripe products load
const FALLBACK_PLANS = [
  { name: "Starter", monthly: 149, annual: 119, leadLimit: 100, features: ["1 location", "Up to 100 leads/month", "AI lead response", "Email notifications", "Basic reporting"] },
  { name: "Growth", monthly: 299, annual: 239, leadLimit: 500, features: ["Up to 500 leads/month", "SMS automation", "Missed-call text back", "Calendar booking", "Team inbox", "3 team members"] },
  { name: "Pro", monthly: 499, annual: 399, leadLimit: 2000, features: ["Multiple locations", "Up to 2,000 leads/month", "Custom AI playbooks", "CRM integrations", "Unlimited team members", "Priority support"] },
];

const PLAN_LEAD_LIMIT: Record<string, number> = { starter: 100, growth: 500, pro: 2000 };

interface StripePlan {
  productId: string;
  name: string;
  description: string;
  monthlyPriceId: string | null;
  monthlyAmount: number | null;
  annualPriceId: string | null;
  annualAmount: number | null;
}

interface BusinessData {
  plan: string;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
}

function parsePlanName(name: string): string {
  return name.replace("BurnCall ", "");
}

export default function Billing() {
  const [annual, setAnnual] = useState(false);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [leadsThisMonth, setLeadsThisMonth] = useState(0);
  const [stripePlans, setStripePlans] = useState<StripePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      setSuccessMessage("Your subscription has been activated! It may take a few seconds to reflect below.");
      window.history.replaceState({}, "", "/billing");
    } else if (params.get("status") === "cancelled") {
      setError("Checkout was cancelled. No charge was made.");
      window.history.replaceState({}, "", "/billing");
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      try {
        const [biz, leads] = await Promise.all([
          api.get<BusinessData>("/api/business"),
          api.get<{ leads: { createdAt: string }[] }>("/api/leads?limit=1000"),
        ]);
        setBusiness(biz);
        const now = new Date();
        setLeadsThisMonth(leads.leads.filter((l) => { const d = new Date(l.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing info");
      }

      try {
        const data = await api.get<{ products: Array<{ id: string; name: string; description: string; prices: Array<{ id: string; unit_amount: number; interval: string | null }> }> }>("/api/stripe/products");
        const plans: StripePlan[] = data.products
          .filter((p) => p.name.startsWith("BurnCall"))
          .map((p) => {
            const monthly = p.prices.find((pr) => pr.interval === "month") ?? null;
            const yearly = p.prices.find((pr) => pr.interval === "year") ?? null;
            return {
              productId: p.id,
              name: parsePlanName(p.name),
              description: p.description ?? "",
              monthlyPriceId: monthly?.id ?? null,
              monthlyAmount: monthly?.unit_amount ?? null,
              annualPriceId: yearly?.id ?? null,
              annualAmount: yearly?.unit_amount ?? null,
            };
          })
          .sort((a, b) => (a.monthlyAmount ?? 0) - (b.monthlyAmount ?? 0));
        if (plans.length > 0) setStripePlans(plans);
      } catch {
        // No live Stripe products yet (not seeded) — fall back to static plan cards below.
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleCheckout = async (priceId: string | null, planName: string) => {
    if (!priceId) { setError("Price not available yet — this plan hasn't been seeded in Stripe. See DEPLOY.md."); return; }
    setCheckoutLoading(planName);
    setError("");
    try {
      const data = await api.post<{ url?: string }>("/api/stripe/checkout", { priceId });
      if (!data.url) throw new Error("Checkout failed — no redirect URL returned");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    setError("");
    try {
      const data = await api.post<{ url?: string }>("/api/stripe/portal");
      if (!data.url) throw new Error("Couldn't open billing portal");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const displayPlans = stripePlans.length > 0
    ? stripePlans
    : FALLBACK_PLANS.map((p) => ({ productId: "", name: p.name, description: "", monthlyPriceId: null as string | null, monthlyAmount: p.monthly * 100, annualPriceId: null as string | null, annualAmount: p.annual * 100 }));

  const currentPlanName = business ? business.plan.charAt(0).toUpperCase() + business.plan.slice(1) : "";
  const leadLimit = business ? (PLAN_LEAD_LIMIT[business.plan] ?? 100) : 100;
  const usagePct = Math.min(100, Math.round((leadsThisMonth / leadLimit) * 100));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Billing</h1>

      {successMessage && (
        <div className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Current plan summary — all real */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
          <p className="text-xl font-bold text-white">{currentPlanName || "—"}</p>
          <Badge className={`mt-1 text-xs border ${business?.subscriptionStatus === "active" || business?.subscriptionStatus === "trialing" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
            {business?.subscriptionStatus ? business.subscriptionStatus.charAt(0).toUpperCase() + business.subscriptionStatus.slice(1) : "No active subscription"}
          </Badge>
        </div>
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Billing Management</p>
          <p className="text-sm text-slate-300 mb-3">Invoices, payment method, and cancellation are all in Stripe's secure portal.</p>
          <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-8 w-full" onClick={openPortal} disabled={portalLoading || !business?.stripeCustomerId} data-testid="open-portal">
            {portalLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            {business?.stripeCustomerId ? "Open Billing Portal" : "Subscribe to a plan first"} <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Leads This Month</p>
          <p className="text-xl font-bold text-white">{leadsThisMonth} / {leadLimit}</p>
          <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
            <div className="bg-[#FF6B2B] h-1.5 rounded-full" style={{ width: `${usagePct}%` }} />
          </div>
          <p className="text-slate-500 text-xs mt-1">{usagePct}% of monthly limit</p>
        </div>
      </div>

      {/* Plan chooser */}
      <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-white font-semibold">{loading ? "Loading Plans..." : stripePlans.length > 0 ? "Change Plan" : "Plans"}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${annual ? "bg-[#FF6B2B]" : "bg-white/20"}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${annual ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-xs ${annual ? "text-white" : "text-slate-500"}`}>Annual <span className="text-green-400">(Save 20%)</span></span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading plans from Stripe...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {displayPlans.map((plan) => {
              const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
              const amount = annual ? plan.annualAmount : plan.monthlyAmount;
              const displayPrice = amount != null ? (annual ? Math.round(amount / 100 / 12) : amount / 100) : null;
              const isCurrent = currentPlanName === plan.name;
              const isLoadingThis = checkoutLoading === plan.name;

              return (
                <div key={plan.name} className={`rounded-xl border p-4 ${isCurrent ? "border-[#FF6B2B] bg-[#FF6B2B]/5" : "border-white/10"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{plan.name}</p>
                    {isCurrent && <Badge className="bg-[#FF6B2B]/20 text-[#FF6B2B] border-[#FF6B2B]/30 text-xs">Current</Badge>}
                  </div>
                  <p className="text-2xl font-bold text-white mb-0.5">{displayPrice != null ? `$${displayPrice}` : "—"}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                  {annual && amount != null && <p className="text-xs text-slate-500 mb-2">billed ${Math.round(amount / 100)}/yr</p>}
                  <p className="text-xs text-slate-500 mb-3">14-day free trial</p>
                  <Button size="sm" disabled={isCurrent || isLoadingThis || !priceId} onClick={() => handleCheckout(priceId, plan.name)} className={`w-full text-xs h-8 ${isCurrent ? "bg-white/5 text-slate-500 cursor-not-allowed" : "bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white"}`} data-testid={`select-plan-${plan.name.toLowerCase()}`}>
                    {isLoadingThis ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Redirecting...</> : isCurrent ? "Current Plan" : !priceId ? "Not Seeded in Stripe" : "Subscribe via Stripe"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-600 text-center mt-4">Secure checkout powered by Stripe · 14-day free trial · Cancel anytime</p>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-white font-semibold text-sm">Danger Zone</p>
        </div>
        <p className="text-slate-400 text-xs mb-4">Cancel or downgrade your subscription in the Stripe billing portal — changes take effect at the end of your billing period.</p>
        <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm" onClick={openPortal} disabled={portalLoading || !business?.stripeCustomerId} data-testid="cancel-subscription">
          Manage / Cancel Subscription
        </Button>
      </div>
    </div>
  );
}
