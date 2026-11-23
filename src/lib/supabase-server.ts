import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url) {
    url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }

  const validUrl =
    url && url.startsWith('http')
      ? url
      : 'https://placeholder-piams.supabase.co';
  const validKey =
    anonKey && anonKey !== 'your-supabase-anon-key'
      ? anonKey
      : 'placeholder-anon-key';

  return createServerClient(validUrl, validKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — ignore
        }
      },
    },
  });
}
