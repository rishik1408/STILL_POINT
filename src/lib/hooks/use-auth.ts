'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Profile, UserRole } from '@/types';
import { MOCK_AUTHORITIES } from '@/lib/mock-data';

export interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
}

const DEMO_CITIZEN_PROFILE: Profile = {
  id: 'p1000000-0000-0000-0000-000000000001',
  full_name: 'Aditi Verma (Citizen Reporter)',
  role: 'user',
  authority_id: null,
  created_at: new Date().toISOString(),
};

const DEMO_OFFICIAL_PROFILE: Profile = {
  id: 'p2000000-0000-0000-0000-000000000002',
  full_name: 'Er. Suresh Patil (Ward A Executive Engineer)',
  role: 'official',
  authority_id: 'a1000000-0000-0000-0000-000000000001',
  created_at: new Date().toISOString(),
};

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback default user profile if table row doesn't exist yet
        const defaultProfile: Profile = {
          id: userId,
          full_name: email?.split('@')[0] || 'Civic User',
          role: 'user',
          authority_id: null,
          created_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
      } else {
        setProfile(data as Profile);
      }
    } catch {
      const defaultProfile: Profile = {
        id: userId,
        full_name: email?.split('@')[0] || 'Civic User',
        role: 'user',
        authority_id: null,
        created_at: new Date().toISOString(),
      };
      setProfile(defaultProfile);
    }
  }, []);

  useEffect(() => {
    // 1. Check local storage for active Demo session first
    const demoRole = localStorage.getItem('piams_demo_role');
    if (demoRole === 'official') {
      setUser({ id: DEMO_OFFICIAL_PROFILE.id, email: 'ward.a.engineer@piams.gov' });
      setProfile(DEMO_OFFICIAL_PROFILE);
      setIsDemo(true);
      setLoading(false);
      return;
    } else if (demoRole === 'user') {
      setUser({ id: DEMO_CITIZEN_PROFILE.id, email: 'aditi.verma@citizen.org' });
      setProfile(DEMO_CITIZEN_PROFILE);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    // 2. Check Supabase Auth
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser({ id: user.id, email: user.email });
          fetchProfile(user.id, user.email);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email });
            fetchProfile(session.user.id, session.user.email);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, [fetchProfile]);

  const loginAsDemo = (role: UserRole) => {
    localStorage.setItem('piams_demo_role', role);
    setIsDemo(true);
    if (role === 'official') {
      setUser({ id: DEMO_OFFICIAL_PROFILE.id, email: 'ward.a.engineer@piams.gov' });
      setProfile(DEMO_OFFICIAL_PROFILE);
      router.push('/official');
    } else {
      setUser({ id: DEMO_CITIZEN_PROFILE.id, email: 'aditi.verma@citizen.org' });
      setProfile(DEMO_CITIZEN_PROFILE);
      router.push('/user');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('piams_demo_role');
    setIsDemo(false);
    setUser(null);
    setProfile(null);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }

    router.push('/login');
  };

  return {
    user,
    profile,
    loading,
    isDemo,
    loginAsDemo,
    signOut,
  };
}
