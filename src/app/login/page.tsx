'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { Button, Input, Select, Badge } from '@/components/ui/shared';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { fetchAuthorities } from '@/lib/data-service';
import { Authority } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'user' | 'official'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [authorityId, setAuthorityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuthorities() {
      try {
        const list = await fetchAuthorities();
        setAuthorities(list);
        if (list.length > 0) {
          setAuthorityId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load authorities:', err);
      }
    }
    loadAuthorities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              authority_id: role === 'official' ? authorityId || null : null,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push(role === 'official' ? '/official' : '/user');
        } else {
          setSuccessMsg(
            'Account registration initialized. If email confirmation is enabled, check your inbox, or use Demo Quick-Switch below for immediate access.'
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'official') {
            router.push('/official');
          } else {
            router.push('/user');
          }
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify credentials or utilize Demo Quick-Switch.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F4EF] text-[#26302A] font-sans selection:bg-[#C58A66]/20">
      {/* ============================================================ */}
      {/* Left Column: Visual Architectural Civic Showcase            */}
      {/* ============================================================ */}
      <div className="lg:w-1/2 bg-[#26302A] text-[#F6F4EF] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#34423A]">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C58A66]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#5E6F63]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header / Brand */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <StillPointLogo
              size="md"
              variant="portal"
              color="#F6F4EF"
              irisColor="#C58A66"
              showWordmark={true}
              subtitle="CIVIC CLARITY"
              wordmarkClassName="text-[#F6F4EF]"
            />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#A3AD9C] hover:text-[#F6F4EF] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return</span>
          </Link>
        </div>

        {/* Philosophical Civic Manifesto */}
        <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34423A] border border-[#415248] text-[11px] font-mono uppercase tracking-[0.2em] text-[#C58A66]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A66] animate-pulse" />
            <span>Deterministic Civic Portal</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-[#F6F4EF] leading-tight">
            Order & Stillness in Urban Stewardship.
          </h1>

          <p className="text-[#A3AD9C] text-xs sm:text-sm leading-relaxed font-light">
            Capture road and infrastructure defects with sub-meter EXIF GPS, route automatically to
            statutory municipal ward engineers via PostGIS spatial polygons, and audit repairs with
            closed-loop computer vision before ticket closure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#1F2722] border border-[#34423A]">
              <div className="flex items-center gap-2 text-[#C58A66] mb-1.5">
                <Compass className="h-4 w-4" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#F6F4EF]">
                  Citizen Portal
                </span>
              </div>
              <p className="text-[11px] text-[#A3AD9C] leading-normal">
                Field camera capture, EXIF metadata extraction, and transparent live ledger tracking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1F2722] border border-[#34423A]">
              <div className="flex items-center gap-2 text-[#C58A66] mb-1.5">
                <FileCheck2 className="h-4 w-4" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#F6F4EF]">
                  Ward Engineers
                </span>
              </div>
              <p className="text-[11px] text-[#A3AD9C] leading-normal">
                Sovereign ward inbox, 14-day statutory SLA countdowns, and optical repair audit verification.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 pt-6 border-t border-[#34423A] flex items-center justify-between text-xs font-mono text-[#5E6F63]">
          <span>STILL POINT Engine</span>
          <span>PostGIS Geodetic Ward Mesh</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Right Column: Auth Form with Demo Quick-Switch               */}
      {/* ============================================================ */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full">
        {/* Top Demo Quick-Switch Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-2xl bg-[#FAF9F5] border border-[#E4E0D6] shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#26302A] uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-[#C58A66] fill-[#C58A66]" />
              Demo Quick-Switch (1-Click Instant Login)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E4E0D6] text-[#5E6F63]">
              Evaluation
            </span>
          </div>
          <p className="text-xs text-[#5E6F63] mb-4 leading-relaxed">
            Test the entire platform instantly without entering credentials:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => loginAsDemo('user')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#F6F4EF] text-[#26302A] border border-[#E4E0D6] hover:bg-[#E4E0D6] hover:border-[#5E6F63] text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-[#5E6F63]" />
              <span>Log in as Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('official')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#26302A] text-[#F6F4EF] hover:bg-[#34423A] text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-[#C58A66]" />
              <span>Log in as Official</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E4E0D6] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 font-serif font-bold text-sm tracking-wide transition-all border-b-2 mr-6 cursor-pointer ${
              mode === 'signin'
                ? 'border-[#26302A] text-[#26302A]'
                : 'border-transparent text-[#5E6F63]/60 hover:text-[#26302A]'
            }`}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3 font-serif font-bold text-sm tracking-wide transition-all border-b-2 cursor-pointer ${
              mode === 'signup'
                ? 'border-[#26302A] text-[#26302A]'
                : 'border-transparent text-[#5E6F63]/60 hover:text-[#26302A]'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#A84835]/10 border border-[#A84835]/30 text-xs text-[#702115] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#A84835] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication Notice:</span> {errorMsg}
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#5E6F63]/10 border border-[#5E6F63]/30 text-xs text-[#26302A] flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#5E6F63] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <Input
                label="Full Name"
                placeholder="e.g. Aditi Verma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#26302A] uppercase tracking-wider">
                  Account Jurisdiction Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      role === 'user'
                        ? 'border-[#26302A] bg-[#FAF9F5] ring-2 ring-[#C58A66]/30'
                        : 'border-[#E4E0D6] hover:border-[#A3AD9C] bg-[#F6F4EF]'
                    }`}
                  >
                    <User
                      className={`h-4 w-4 mb-1.5 ${
                        role === 'user' ? 'text-[#C58A66]' : 'text-[#5E6F63]'
                      }`}
                    />
                    <div className="text-xs font-serif font-bold text-[#26302A]">Public Citizen</div>
                    <div className="text-[11px] text-[#5E6F63]">Report & audit hazards</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('official')}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      role === 'official'
                        ? 'border-[#26302A] bg-[#FAF9F5] ring-2 ring-[#C58A66]/30'
                        : 'border-[#E4E0D6] hover:border-[#A3AD9C] bg-[#F6F4EF]'
                    }`}
                  >
                    <Building2
                      className={`h-4 w-4 mb-1.5 ${
                        role === 'official' ? 'text-[#C58A66]' : 'text-[#5E6F63]'
                      }`}
                    />
                    <div className="text-xs font-serif font-bold text-[#26302A]">Ward Official</div>
                    <div className="text-[11px] text-[#5E6F63]">Executive engineer</div>
                  </button>
                </div>
              </div>

              {role === 'official' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#26302A] uppercase tracking-wider">
                    Assigned Municipal Ward
                  </label>
                  {authorities.length > 0 ? (
                    <Select
                      value={authorityId}
                      onChange={(e) => setAuthorityId(e.target.value)}
                      options={authorities.map((a) => ({
                        value: a.id,
                        label: `${a.ward_name} — ${a.department_name}`,
                      }))}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E4E0D6] bg-[#FAF9F5] text-[#26302A]"
                      value={authorityId}
                      onChange={(e) => setAuthorityId(e.target.value)}
                      placeholder="Ward jurisdiction identifier (e.g. Ward A)"
                    />
                  )}
                </div>
              )}
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="name@domain.com"
            icon={<Mail className="h-4 w-4 text-[#5E6F63]" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4 text-[#5E6F63]" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-2 bg-[#26302A] text-[#F6F4EF] hover:bg-[#34423A]"
            size="lg"
          >
            <span>{mode === 'signin' ? 'Sign In to STILL POINT' : 'Register Account'}</span>
            <ArrowRight className="h-4 w-4 ml-1 text-[#C58A66]" />
          </Button>
        </form>

        <p className="text-center text-xs text-[#5E6F63] mt-6 leading-relaxed">
          Accessing STILL POINT establishes a cryptographically signed session on the public municipal ledger.
        </p>
      </div>
    </div>
  );
}
