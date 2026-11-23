// ============================================================
// STILL POINT Mobile Environment Configuration
// Reads strictly from EXPO_PUBLIC_* variables (never hardcodes secrets or localhost)
// ============================================================

export function getSupabaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return '';
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

export function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
}

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return '';
  return raw.replace(/\/$/, '');
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
      url.startsWith('http') &&
      !url.includes('your-project-ref') &&
      key &&
      key !== 'your-supabase-anon-key'
  );
}

export function isApiConfigured(): boolean {
  const base = getApiBaseUrl();
  return Boolean(base && base.startsWith('http') && !base.includes('your-stillpoint-web-app'));
}
