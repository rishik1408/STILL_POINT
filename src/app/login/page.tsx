'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Building2,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
} from 'lucide-react';
import { Button, Input, Select, Card, Badge } from '@/components/ui/shared';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { MOCK_AUTHORITIES } from '@/lib/mock-data';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'user' | 'official'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authorityId, setAuthorityId] = useState(MOCK_AUTHORITIES[0].id);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
              authority_id: role === 'official' ? authorityId : null,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push(role === 'official' ? '/official' : '/user');
        } else {
          setSuccessMsg('Account created! Please check your email to verify, or use Demo Quick-Switch to test immediately.');
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
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check credentials or use Demo Quick-Switch.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* Left Column: Visual Civic Brand Showcase */}
      <div className="lg:w-1/2 bg-[#1B365D] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40 group-hover:scale-105 transition">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">PIAMS</span>
              <span className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold">Civic Infrastructure Portal</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 my-12 lg:my-0 space-y-6 max-w-lg">
          <Badge variant="blue" className="bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Dual-Pipeline Public & Municipal Platform
          </Badge>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            AI-Assisted Infrastructure Monitoring & Verified Audit
          </h1>

          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            Report hazards in 60 seconds with camera EXIF GPS, route automatically to municipal engineering wards via PostGIS, and audit completed repairs with paired before-and-after multimodal AI.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <User className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Citizen Portal</span>
              </div>
              <p className="text-xs text-slate-300">Snap photo, AI triages defect & severity, PostGIS notifies ward.</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">Officials Portal</span>
              </div>
              <p className="text-xs text-slate-300">Ward-scoped queue, field crew dispatch, verified audit sign-off.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>PIAMS Municipal Infrastructure Suite</span>
          <span>Mumbai Metropolitan Region</span>
        </div>
      </div>

      {/* Right Column: Auth Form with Demo Quick-Switch */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-xl mx-auto w-full">
        {/* Top Demo Quick-Switch Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B365D] uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Demo Quick-Switch (1-Click Instant Login)
            </span>
            <Badge variant="blue" size="sm">Evaluation Mode</Badge>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Test the entire platform instantly without configuring email verification:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => loginAsDemo('user')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white text-slate-800 border border-slate-200 hover:border-blue-500 hover:text-blue-700 shadow-xs font-semibold text-xs transition cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>Log in as Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo('official')}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1B365D] text-white hover:bg-[#152a4a] shadow-xs font-semibold text-xs transition cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Log in as Official</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 mr-6 ${
              mode === 'signin'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
              mode === 'signup'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Create New Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
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
                <label className="block text-sm font-medium text-slate-700">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      role === 'user'
                        ? 'border-[#1D4ED8] bg-blue-50/50 ring-2 ring-[#1D4ED8]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <User className={`h-4 w-4 mb-1 ${role === 'user' ? 'text-[#1D4ED8]' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-900">Public Citizen</div>
                    <div className="text-[11px] text-slate-500">Report & track defects</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('official')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      role === 'official'
                        ? 'border-[#1B365D] bg-slate-100 ring-2 ring-[#1B365D]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Building2 className={`h-4 w-4 mb-1 ${role === 'official' ? 'text-[#1B365D]' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-900">Municipal Official</div>
                    <div className="text-[11px] text-slate-500">Ward operator & crew</div>
                  </button>
                </div>
              </div>

              {role === 'official' && (
                <Select
                  label="Assigned Municipal Ward"
                  value={authorityId}
                  onChange={(e) => setAuthorityId(e.target.value)}
                  options={MOCK_AUTHORITIES.map((a) => ({
                    value: a.id,
                    label: `${a.ward_name} — ${a.department_name}`,
                  }))}
                />
              )}
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="name@domain.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-2"
            size="lg"
          >
            <span>{mode === 'signin' ? 'Sign In' : 'Create PIAMS Account'}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          By signing in, you agree to PIAMS data logging and civic verification policies under the Municipal Governance Code.
        </p>
      </div>
    </div>
  );
}
