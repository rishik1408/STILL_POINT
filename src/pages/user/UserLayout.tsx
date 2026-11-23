import { Link, Outlet, useLocation } from 'react-router-dom';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Map, PlusCircle, Layers, CheckSquare, ArrowLeft, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

export function UserLayout() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = [
    { label: 'Interactive Map', href: '/user/map', icon: Map },
    { label: 'Report Defect', href: '/user/report', icon: PlusCircle },
    { label: 'Asset Registry', href: '/user/registry', icon: Layers },
    { label: 'AI Auditor', href: '/user/auditor', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4EF] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#EDE9E0] border-r border-[#E4E0D6] shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand header */}
        <div className="p-6 border-b border-[#E4E0D6]">
          <Link to="/" className="block">
            <StillPointLogo
              size={50}
              subtitle="Citizen Field Portal"
            />
          </Link>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 mx-4 my-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5E6F63] text-[#F6F4EF] flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.full_name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#26302A] truncate">
                {profile?.full_name || 'Citizen Reporter'}
              </p>
              <p className="text-[11px] text-[#5E6F63] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block"></span>
                Active Reporter
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#26302A] text-[#F6F4EF] shadow-sm'
                    : 'text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#C58A66]' : 'text-[#5E6F63]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#E4E0D6] space-y-2">
          <Link
            to="/official"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]"
          >
            <Shield className="w-4 h-4 text-[#C58A66]" />
            <span>Switch to Official Console</span>
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E0D6]/60">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-[#5E6F63] hover:text-[#26302A]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Landing
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-[#A84835] hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#EDE9E0] border-b border-[#E4E0D6] sticky top-0 z-30">
          <Link to="/">
            <StillPointLogo
              size={36}
            />
          </Link>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-[#5E6F63] hover:text-[#26302A]"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#EDE9E0]/95 backdrop-blur-md border-t border-[#E4E0D6] flex justify-around py-2.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#26302A] font-bold' : 'text-[#5E6F63]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#C58A66]' : 'text-[#5E6F63]'}`} />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
