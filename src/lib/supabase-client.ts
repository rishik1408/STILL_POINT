import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Read environment variables safely for Vite
const supabaseUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://ncvuwbmetnazxbuorvjo.supabase.co';

const supabaseAnonKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_S67-y2C7A2axeMiNzKnCug_SZX2ezmH';

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}

export const supabase = createClient();
