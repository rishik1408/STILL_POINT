// ============================================================
// STILL POINT Mobile Auth Context
// Supabase Auth persisted via expo-secure-store + strict Official Role Guard
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import {
  canProfileAccessMobileApp,
  OFFICIAL_BLOCK_MESSAGE,
  OFFICIAL_BLOCK_TITLE,
} from '@/lib/role-guard';
import { Profile } from '@/types';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface OfficialBlockNotice {
  title: string;
  message: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  officialBlockNotice: OfficialBlockNotice | null;
  clearOfficialBlockNotice: () => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string; blockedOfficial?: boolean }>;
  signUpCitizen: (email: string, password: string, fullName: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUserProfile(userId: string, email?: string, metadataRole?: unknown): Promise<Profile> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && data) {
    return data as Profile;
  }

  return {
    id: userId,
    full_name: email?.split('@')[0] || 'Civic Citizen',
    role: metadataRole === 'official' ? 'official' : 'user',
    authority_id: null,
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [officialBlockNotice, setOfficialBlockNotice] =
    useState<OfficialBlockNotice | null>(null);

  const applySessionUser = useCallback(
    async (sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const loadedProfile = await loadUserProfile(
        sessionUser.id,
        sessionUser.email,
        sessionUser.user_metadata?.role
      );

      const decision = canProfileAccessMobileApp(loadedProfile, sessionUser.user_metadata?.role);
      if (!decision.allowed) {
        // Strictly block officials from mobile dashboard and clear their mobile session
        const supabase = getSupabaseClient();
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
        setProfile(null);
        setOfficialBlockNotice({
          title: decision.title || OFFICIAL_BLOCK_TITLE,
          message: decision.message || OFFICIAL_BLOCK_MESSAGE,
        });
        setLoading(false);
        return;
      }

      setOfficialBlockNotice(null);
      setUser({ id: sessionUser.id, email: sessionUser.email });
      setProfile(loadedProfile);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        return applySessionUser(session?.user ?? null);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      applySessionUser(session?.user ?? null).catch(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySessionUser]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setOfficialBlockNotice(null);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const loadedProfile = await loadUserProfile(
          data.user.id,
          data.user.email,
          data.user.user_metadata?.role
        );
        const decision = canProfileAccessMobileApp(
          loadedProfile,
          data.user.user_metadata?.role
        );

        if (!decision.allowed) {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setProfile(null);
          setOfficialBlockNotice({
            title: decision.title || OFFICIAL_BLOCK_TITLE,
            message: decision.message || OFFICIAL_BLOCK_MESSAGE,
          });
          return { blockedOfficial: true };
        }

        setUser({ id: data.user.id, email: data.user.email });
        setProfile(loadedProfile);
      }

      return {};
    },
    []
  );

  const signUpCitizen = useCallback(
    async (email: string, password: string, fullName: string) => {
      setOfficialBlockNotice(null);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'user',
            authority_id: null,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.session) {
        return { needsConfirmation: true };
      }

      if (data.user) {
        await applySessionUser(data.user);
      }
      return {};
    },
    [applySessionUser]
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setProfile(null);
  }, []);

  const clearOfficialBlockNotice = useCallback(() => {
    setOfficialBlockNotice(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        officialBlockNotice,
        clearOfficialBlockNotice,
        signInWithPassword,
        signUpCitizen,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
