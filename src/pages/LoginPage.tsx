import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Card, Button, Input } from '@/components/ui/shared';
import { useAuth } from '@/lib/hooks/use-auth';
import { createClient } from '@/lib/supabase-client';
import { Shield, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        alert('Account created! Please check your email or proceed with login.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Route by role
        if (role === 'official') {
          navigate('/official');
        } else {
          navigate('/user');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials or try Demo mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4">
          <StillPointLogo
            size={72}
            subtitle="Civic Infrastructure Intelligence"
          />
        </Link>
        <h2 className="text-2xl font-serif font-bold text-[#26302A]">
          {isSignUp ? 'Create Civic Account' : 'Sign in to Portal'}
        </h2>
        <p className="mt-1 text-xs text-[#5E6F63]">
          Access the Public Infrastructure Asset Monitoring System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Instant Demo Switcher Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-[#EDE9E0] border border-[#E4E0D6] space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C58A66]" />
            <span className="text-xs font-bold text-[#26302A]">
              1-Click Instant Demo Access
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loginAsDemo('user')}
              className="gap-1.5 border-[#D5CFBE] bg-[#F6F4EF] text-xs hover:bg-[#E4E0D6]"
            >
              <User className="w-3.5 h-3.5 text-[#C58A66]" />
              <span>Demo Citizen</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loginAsDemo('official')}
              className="gap-1.5 border-[#D5CFBE] bg-[#F6F4EF] text-xs hover:bg-[#E4E0D6]"
            >
              <Shield className="w-3.5 h-3.5 text-[#5E6F63]" />
              <span>Demo Official</span>
            </Button>
          </div>
        </div>

        {/* Auth Form Card */}
        <Card className="p-6 sm:p-8 space-y-6 bg-white border-[#E4E0D6] shadow-sm">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#EDE9E0] rounded-xl border border-[#E4E0D6]">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'user'
                  ? 'bg-white text-[#26302A] shadow-sm'
                  : 'text-[#5E6F63] hover:text-[#26302A]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#C58A66]" />
              <span>Public Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('official')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'official'
                  ? 'bg-[#26302A] text-white shadow-sm'
                  : 'text-[#5E6F63] hover:text-[#26302A]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#C58A66]" />
              <span>Municipal Official</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#A84835]/15 border border-[#A84835]/30 text-[#A84835] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-[#26302A] mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditi Verma"
                  className="bg-[#F6F4EF]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#26302A] mb-1">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-[#F6F4EF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26302A] mb-1">
                Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#F6F4EF]"
              />
            </div>

            <Button
              type="submit"
              variant={role === 'official' ? 'primary' : 'clay'}
              size="lg"
              loading={loading}
              className="w-full justify-center mt-2 shadow-sm"
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center pt-2 border-t border-[#E4E0D6]">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[#5E6F63] hover:text-[#26302A] font-semibold underline underline-offset-4"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
