'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Map,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HardHat,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/shared';
import { MOCK_AUTHORITIES } from '@/lib/mock-data';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Operator Overview', href: '/official', icon: LayoutDashboard },
  { name: 'Ward Dispatch Map', href: '/official/map', icon: Map },
];

export default function OfficialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, isDemo, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active ward info
  const activeWard = MOCK_AUTHORITIES[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#1B365D] text-white px-4 h-16 flex items-center justify-between shadow-md">
        <Link href="/official" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center font-bold">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm">PIAMS Official</span>
            <p className="text-[10px] text-amber-300">Ward A Operator</p>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-white hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1B365D] text-white p-4 sticky top-0 h-screen justify-between shrink-0 shadow-xl">
        <div>
          {/* Logo & Ward Badge */}
          <Link href="/official" className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center shadow-md">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">PIAMS</span>
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Officials Portal</p>
            </div>
          </Link>

          {/* Assigned Municipal Ward Box */}
          <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-xs mb-6">
            <span className="text-[10px] uppercase font-bold text-slate-300 block mb-0.5">Assigned Jurisdiction</span>
            <p className="font-bold text-white text-xs leading-snug">{activeWard.ward_name}</p>
            <p className="text-[11px] text-slate-300 mt-1">{activeWard.department_name}</p>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Citizen Portal Shortcut */}
          <div className="mt-8 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300">Public Portal</span>
              <Link href="/user/map" className="text-blue-400 hover:underline flex items-center gap-0.5 text-[11px]">
                Switch <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              View public citizen map and transparent audit trails.
            </p>
          </div>
        </div>

        {/* Official User Profile & Sign Out */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
              SP
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {profile?.full_name || 'Er. Suresh Patil'}
              </p>
              <p className="text-[10px] text-amber-300 truncate">
                Executive Engineer
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/20 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Official Content */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
