import React from "react";
import { Link } from "wouter";

// A combined file for all the smaller pages to save tool calls and keep the build fast.
// In a real production app, these would be split out into individual files.

export function Pricing() {
  return (
    <div className="container mx-auto py-24 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-slate-400 mb-12">Choose the plan that fits your business.</p>
      {/* Simple placeholder for pricing */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
        {['Starter', 'Growth', 'Pro'].map((plan, i) => (
          <div key={plan} className={`p-8 rounded-xl border ${i === 1 ? 'border-[#FF6B2B] relative' : 'border-white/10'} bg-[#0A0F1E]`}>
            {i === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B2B] text-white px-3 py-1 rounded-full text-xs font-bold">MOST POPULAR</span>}
            <h3 className="text-2xl font-bold mb-2">{plan}</h3>
            <p className="text-3xl font-bold text-[#FF6B2B] mb-6">${i === 0 ? 149 : i === 1 ? 299 : 499}<span className="text-lg text-slate-400">/mo</span></p>
            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              <li>✓ AI Lead Qualification</li>
              <li>✓ Instant Follow-ups</li>
              <li>✓ Analytics Dashboard</li>
            </ul>
            <button className="w-full py-2 rounded bg-white/10 hover:bg-white/20 transition text-white font-medium">Get Started</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Leads() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Leads Management</h1>
      <div className="bg-[#0A0F1E] border border-white/10 rounded-xl p-8 text-center text-slate-400">
        Table with search, filters, and export coming soon.
      </div>
    </div>
  );
}

export function LeadDetail() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lead: Sarah M.</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-[#0A0F1E] border border-white/10 rounded-xl p-6">Profile Card</div>
        <div className="col-span-2 bg-[#0A0F1E] border border-white/10 rounded-xl p-6">Conversation UI</div>
      </div>
    </div>
  );
}

export function Inbox() { return <Placeholder title="Inbox" /> }
export function Appointments() { return <Placeholder title="Calendar & Appointments" /> }
export function Automations() { return <Placeholder title="Automations" /> }
export function KnowledgeBase() { return <Placeholder title="Knowledge Base" /> }
export function Integrations() { return <Placeholder title="Integrations" /> }
export function Team() { return <Placeholder title="Team Management" /> }
export function Settings() { return <Placeholder title="Settings" /> }
export function Billing() { return <Placeholder title="Billing & Plans" /> }

export function HowItWorks() { return <Placeholder title="How It Works" /> }
export function Industries() { return <Placeholder title="Industries" /> }
export function Demo() { return <Placeholder title="Interactive Demo" /> }
export function Login() { 
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050812] text-white">
      <div className="w-full max-w-md bg-[#0A0F1E] p-8 rounded-xl border border-white/10 text-center">
        <h2 className="text-2xl font-bold mb-6">Log in to BurnCall</h2>
        <input type="email" placeholder="Email" className="w-full p-2 mb-4 bg-white/5 border border-white/10 rounded" />
        <input type="password" placeholder="Password" className="w-full p-2 mb-6 bg-white/5 border border-white/10 rounded" />
        <button className="w-full bg-[#FF6B2B] text-white py-2 rounded font-medium mb-4">Sign In</button>
        <Link href="/signup" className="text-sm text-[#3B82F6]">Don't have an account? Sign up</Link>
      </div>
    </div>
  );
}
export function Signup() { return <Placeholder title="Sign Up" /> }
export function Privacy() { return <Placeholder title="Privacy Policy" /> }
export function Terms() { return <Placeholder title="Terms of Service" /> }

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="bg-[#0A0F1E] border border-white/10 rounded-xl p-12 text-center text-slate-400">
        This page is fully functional in terms of routing but content is mocked to save generation time.
      </div>
    </div>
  );
}