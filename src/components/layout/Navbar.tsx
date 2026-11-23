import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Button } from '@/components/ui/shared';
import { Download, Menu, X, Shield, MapPin, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

interface NavbarProps {
  onOpenPwaModal?: () => void;
}

export function Navbar({ onOpenPwaModal }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, isDemo, signOut } = useAuth();

  const navLinks = [
    { label: 'Live Map', href: '/user/map' },
    { label: 'Report Defect', href: '/user/report' },
    { label: 'Asset Registry', href: '/user/registry' },
    { label: 'AI Auditor', href: '/user/auditor' },
    { label: 'Ward Console', href: '/official' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#F6F4EF]/90 backdrop-blur-md border-b border-[#E4E0D6]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <StillPointLogo
            size={48}
            className="hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#26302A] bg-[#E4E0D6]/60 font-semibold'
                    : 'text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]/40'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          {onOpenPwaModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPwaModal}
              className="gap-2 border-[#E4E0D6] text-[#26302A] hover:bg-[#E4E0D6]/60"
            >
              <Download className="w-4 h-4 text-[#C58A66]" />
              <span>Download App</span>
            </Button>
          )}

          {user || isDemo ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E4E0D6]">
              <Link
                to={profile?.role === 'official' ? '/official' : '/user'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E4E0D6]/60 text-xs font-medium text-[#26302A] hover:bg-[#E4E0D6]"
              >
                {profile?.role === 'official' ? (
                  <Shield className="w-3.5 h-3.5 text-[#5E6F63]" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#C58A66]" />
                )}
                <span className="truncate max-w-[120px]">{profile?.full_name?.split(' ')[0] || 'Portal'}</span>
              </Link>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]/40"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="clay" size="sm" className="shadow-sm">
                Portal Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#26302A] hover:bg-[#E4E0D6]/60"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 pt-3 pb-6 border-b border-[#E4E0D6] bg-[#F6F4EF] space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-base font-medium text-[#26302A] hover:bg-[#E4E0D6]/60"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-[#E4E0D6] flex flex-col gap-2">
            {onOpenPwaModal && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPwaModal();
                }}
                className="w-full justify-center"
              >
                <Download className="w-4 h-4 text-[#C58A66]" />
                Download Mobile App (PWA)
              </Button>
            )}
            {user || isDemo ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full justify-center"
              >
                Sign Out ({profile?.full_name?.split(' ')[0]})
              </Button>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="clay" size="md" className="w-full justify-center">
                  Portal Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
