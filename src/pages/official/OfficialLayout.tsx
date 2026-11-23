import { Link, Outlet, useLocation } from 'react-router-dom';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Shield, LayoutDashboard, Map, ArrowLeft, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

export function OfficialLayout() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = [
    { label: 'Ward Ticket Queue', href: '/official', icon: LayoutDashboard },
    { label: 'Dispatch Map', href: '/official/map', icon: Map },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4EF] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#26302A] text-[#F6F4EF] shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand header */}
        <div className="p-6 border-b border-[#3D4B41]">
          <Link to="/" className="block">
            <StillPointLogo
              size={50}
              inverted={true}
              subtitle="Municipal Command Console"
            />
          </Link>
        </div>

        {/* Official Identity Card */}
        <div className="px-6 py-4 mx-4 my-4 rounded-xl bg-[#3D4B41]/50 border border-[#4D5E52]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C58A66] text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F6F4EF] truncate">
                {profile?.full_name || 'Ward Executive Engineer'}
              </p>
              <p className="text-[11px] text-[#A3AD9C] truncate">
                BBMP East Zone (Indiranagar / MG Road)
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
                    ? 'bg-[#5E6F63] text-white shadow-sm'
                    : 'text-[#A3AD9C] hover:text-[#F6F4EF] hover:bg-[#3D4B41]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#C58A66]' : 'text-[#A3AD9C]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#3D4B41] space-y-2">
          <Link
            to="/user"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#A3AD9C] hover:text-[#F6F4EF] hover:bg-[#3D4B41]"
          >
            <User className="w-4 h-4 text-[#C58A66]" />
            <span>Switch to Citizen Portal</span>
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-[#3D4B41]/60">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-[#A3AD9C] hover:text-[#F6F4EF]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Landing
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-[#C58A66] hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-[#26302A] text-[#F6F4EF] sticky top-0 z-30">
          <Link to="/">
            <StillPointLogo
              size={36}
              inverted={true}
            />
          </Link>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-[#A3AD9C] hover:text-[#F6F4EF]"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
