import React from "react";
import { Link, useLocation } from "wouter";
import logoPath from "@assets/bestlogo_1782311057091.png";
import { 
  LayoutDashboard, Users, MessageSquare, Calendar, Zap, 
  BookOpen, Plug, Users2, Settings, CreditCard, Bell, Search, Menu, Shield
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Calendar', href: '/appointments', icon: Calendar },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Team', href: '/team', icon: Users2 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Billing', href: '/billing', icon: CreditCard },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = user?.isPlatformAdmin
    ? [...navigation, { name: "Platform Admin", href: "/admin", icon: Shield }]
    : navigation;

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + '/');
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              isActive 
                ? "bg-[#FF6B2B]/10 text-[#FF6B2B]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon className={`h-4 w-4 ${isActive ? "text-[#FF6B2B]" : ""}`} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#050812] text-white dark">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0A0F1E] md:flex">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src={logoPath} alt="BurnCall" className="h-7 w-auto" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto py-4 px-3 space-y-1">
          <NavLinks />
        </div>
        
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarFallback className="bg-[#3B82F6] text-white">JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">John Doe</span>
              <Badge variant="secondary" className="bg-[#FF6B2B]/20 text-[#FF6B2B] hover:bg-[#FF6B2B]/30 text-[10px] px-1.5 py-0">Pro Plan</Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0A0F1E] px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-[#0A0F1E] border-r-white/10 p-0 text-white">
                <div className="flex h-16 items-center px-6 border-b border-white/10">
                  <img src={logoPath} alt="BurnCall" className="h-7 w-auto" />
                </div>
                <div className="py-4 px-3 space-y-1">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
            
            <form className="hidden md:flex relative w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search leads, jobs, or phone numbers..."
                className="w-full bg-white/5 border-white/10 pl-9 text-sm focus-visible:ring-[#FF6B2B]"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#FF6B2B]"></span>
            </Button>
            <Link href="/leads/detail">
              <Button size="sm" className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white border-none">
                + New Lead
              </Button>
            </Link>
          </div>
        </header>
        
        {/* Main scrollable area */}
        <main className="flex-1 overflow-auto bg-[#050812] p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
