import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
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

  return createBrowserClient(validUrl, validKey);
}
