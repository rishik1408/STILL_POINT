'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  PlusCircle,
  FolderKanban,
  CheckCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/shared';
import { StillPointLogo } from '@/components/ui/StillPointLogo';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Map;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Sanctuary Map', href: '/user/map', icon: Map },
  { name: 'Report Defect', href: '/user/report', icon: PlusCircle, badge: 'AI' },
  { name: 'Asset Registry', href: '/user/registry', icon: FolderKanban },
  { name: 'Auditor & SLA', href: '/user/auditor', icon: CheckCheck, badge: 'Audit' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, isDemo, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#26302A] flex flex-col md:flex-row antialiased selection:bg-[#C58A66]/20 selection:text-[#26302A]">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#F6F4EF]/90 backdrop-blur-md border-b border-[#E4E0D6] px-4 h-16 flex items-center justify-between">
        <Link href="/user/map" className="flex items-center gap-2.5">
          <StillPointLogo size="sm" variant="portal" color="#26302A" irisColor="#C58A66" />
          <div className="flex flex-col">
            <span className="font-serif tracking-widest text-[#26302A] text-sm font-bold">STILL POINT</span>
            <span className="text-[10px] tracking-wider uppercase text-[#5E6F63] font-mono">Citizen Portal</span>
          </div>
          {isDemo && (
            <span className="ml-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#E4E0D6] text-[#5E6F63] border border-[#A3AD9C]/40">
              Demo
            </span>
          )}
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-[#26302A] hover:bg-[#E4E0D6]/60 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-68 bg-[#F6F4EF] border-r border-[#E4E0D6] p-5 sticky top-0 h-screen justify-between shrink-0 shadow-[1px_0_0_0_#E4E0D6]">
        <div>
          {/* Brand Mark & Title */}
          <Link
            href="/user/map"
            className="group flex items-center gap-3.5 px-2 py-3 mb-6 rounded-2xl hover:bg-[#E4E0D6]/40 transition duration-200"
          >
            <StillPointLogo
              size={34}
              variant="portal"
              color="#26302A"
              irisColor="#C58A66"
              className="group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base tracking-[0.16em] text-[#26302A] leading-none">
                STILL POINT
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#5E6F63] font-mono mt-1">
                Civic Sanctuary
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-[#A3AD9C] mb-2 font-semibold">
              Portal Directory
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#26302A] text-[#F6F4EF] shadow-sm font-semibold'
                      : 'text-[#26302A]/80 hover:bg-[#E4E0D6]/70 hover:text-[#26302A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#C58A66]' : 'text-[#5E6F63]'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded tracking-wide ${
                        isActive
                          ? 'bg-[#C58A66] text-white font-bold'
                          : 'bg-[#E4E0D6] text-[#5E6F63] border border-[#A3AD9C]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Official Portal Switcher */}
          <div className="mt-8 p-3.5 rounded-2xl bg-white/60 border border-[#E4E0D6] text-xs shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-[#26302A] tracking-tight">Official Ward Desk</span>
              <Link
                href="/official"
                className="text-[#C58A66] hover:text-[#B85D36] font-semibold flex items-center gap-1 text-[11px] transition"
              >
                Switch <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-[11px] text-[#5E6F63] leading-relaxed">
              Municipal engineering operators access dispatch queues and remediation approvals.
            </p>
          </div>
        </div>

        {/* User Card & Sign Out */}
        <div className="pt-4 border-t border-[#E4E0D6]">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-xl bg-[#E4E0D6] border border-[#A3AD9C]/40 flex items-center justify-center text-[#26302A] font-serif font-bold text-xs shrink-0 shadow-2xs">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#26302A] truncate">
                {profile?.full_name || 'Citizen Auditor'}
              </p>
              <p className="text-[10px] text-[#5E6F63] truncate font-mono">
                {user?.email || 'citizen@stillpoint.city'}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#702115] hover:bg-[#A84835]/10 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-[#A84835]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F6F4EF] border-b border-[#E4E0D6] p-4 space-y-2 z-30 shadow-md">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#26302A] text-[#F6F4EF]'
                    : 'text-[#26302A] hover:bg-[#E4E0D6]/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#C58A66]' : 'text-[#5E6F63]'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C58A66] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#E4E0D6] flex items-center justify-between text-xs">
            <span className="text-[#5E6F63]">{profile?.full_name || 'Citizen'}</span>
            <button onClick={signOut} className="text-[#A84835] font-semibold text-xs">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen pb-16 md:pb-0 bg-[#F6F4EF]">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F6F4EF]/95 backdrop-blur-md border-t border-[#E4E0D6] px-3 py-2 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
                isActive ? 'text-[#26302A] font-bold' : 'text-[#5E6F63]'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-[#C58A66]' : 'text-[#5E6F63]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
