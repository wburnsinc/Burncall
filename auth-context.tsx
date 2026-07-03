import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import MarketingLayout from "@/components/layout/MarketingLayout";
import AppLayout from "@/components/layout/AppLayout";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Dashboard from "@/pages/Dashboard";
import Demo from "@/pages/Demo";
import Pricing from "@/pages/Pricing";
import HowItWorks from "@/pages/HowItWorks";
import Industries from "@/pages/Industries";
import Signup from "@/pages/Signup";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Leads from "@/pages/Leads";
import LeadDetail from "@/pages/LeadDetail";
import Inbox from "@/pages/Inbox";
import Appointments from "@/pages/Appointments";
import Automations from "@/pages/Automations";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Integrations from "@/pages/Integrations";
import Team from "@/pages/Team";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Login from "@/pages/Login";
import AcceptInvite from "@/pages/AcceptInvite";
import Onboarding from "@/pages/Onboarding";
import Admin from "@/pages/Admin";
import { AuthProvider } from "@/lib/auth-context";
import ProtectedRoute, { RequirePlatformAdmin } from "@/lib/protected-route";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* App Routes (require an authenticated session) */}
      <Route path="/dashboard">
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute><AppLayout><Leads /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/leads/:id">
        <ProtectedRoute><AppLayout><LeadDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/leads/detail">
        <ProtectedRoute><AppLayout><LeadDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/inbox">
        <ProtectedRoute><AppLayout><Inbox /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute><AppLayout><Appointments /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/automations">
        <ProtectedRoute><AppLayout><Automations /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/knowledge-base">
        <ProtectedRoute><AppLayout><KnowledgeBase /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/integrations">
        <ProtectedRoute><AppLayout><Integrations /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/team">
        <ProtectedRoute><AppLayout><Team /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute><AppLayout><Billing /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <RequirePlatformAdmin><Admin /></RequirePlatformAdmin>
      </Route>

      {/* Auth & Onboarding Routes */}
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/accept-invite">
        <AcceptInvite />
      </Route>
      <Route path="/signup">
        <Signup />
      </Route>
      <Route path="/onboarding">
        <Onboarding />
      </Route>

      {/* Marketing Routes */}
      <Route path="/">
        <MarketingLayout><Home /></MarketingLayout>
      </Route>
      <Route path="/about">
        <MarketingLayout><About /></MarketingLayout>
      </Route>
      <Route path="/pricing">
        <MarketingLayout><Pricing /></MarketingLayout>
      </Route>
      <Route path="/how-it-works">
        <MarketingLayout><HowItWorks /></MarketingLayout>
      </Route>
      <Route path="/industries">
        <MarketingLayout><Industries /></MarketingLayout>
      </Route>
      <Route path="/demo">
        <MarketingLayout><Demo /></MarketingLayout>
      </Route>

      {/* Legal Routes */}
      <Route path="/privacy">
        <MarketingLayout><Privacy /></MarketingLayout>
      </Route>
      <Route path="/terms">
        <MarketingLayout><Terms /></MarketingLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
