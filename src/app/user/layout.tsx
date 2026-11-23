'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  PlusCircle,
  FolderKanban,
  CheckCheck,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge, Button } from '@/components/ui/shared';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Map;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Live Map', href: '/user/map', icon: Map },
  { name: 'Report Defect', href: '/user/report', icon: PlusCircle, badge: 'AI' },
  { name: 'Asset Registry', href: '/user/registry', icon: FolderKanban },
  { name: 'Auditor & SLA', href: '/user/auditor', icon: CheckCheck, badge: 'Audit' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, isDemo, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <Link href="/user/map" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#1B365D] flex items-center justify-center text-white">
            <ShieldAlert className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">PIAMS Citizen</span>
            {isDemo && <Badge variant="blue" size="sm" className="ml-2 text-[10px]">Demo Mode</Badge>}
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen justify-between shrink-0">
        <div>
          {/* Logo & Platform Info */}
          <Link href="/user/map" className="flex items-center gap-2.5 px-2 py-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-[#1B365D] flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight">PIAMS</span>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Citizen Portal</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Municipal Switcher */}
          <div className="mt-8 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700">Official Portal</span>
              <Link href="/official" className="text-blue-600 hover:underline flex items-center gap-0.5 text-[11px]">
                Switch <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-500">
              Ward engineering operators manage queues in the Officials Portal.
            </p>
          </div>
        </div>

        {/* User Card & Sign Out */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">
                {profile?.full_name || 'Citizen User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user?.email || 'citizen@piams.gov'}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 z-30">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-[#1D4ED8] text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">{item.badge}</span>}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{profile?.full_name || 'Citizen'}</span>
            <button onClick={signOut} className="text-red-600 font-semibold">Sign Out</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
                isActive ? 'text-[#1D4ED8] font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
