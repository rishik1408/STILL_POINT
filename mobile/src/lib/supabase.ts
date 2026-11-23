// ============================================================
// STILL POINT Mobile Supabase Client with expo-secure-store
// Uses chunked SecureStore persistence so large Supabase JWT
// sessions persist reliably within Android's 2048-byte entry limit.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/config';

const SECURE_STORE_CHUNK_SIZE = 1800;

function sanitizeSecureStoreKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const ExpoSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const safeKey = sanitizeSecureStoreKey(key);
    const countRaw = await SecureStore.getItemAsync(`${safeKey}__chunks`);
    if (countRaw) {
      const count = parseInt(countRaw, 10);
      if (!Number.isNaN(count) && count > 0) {
        const parts: string[] = [];
        for (let i = 0; i < count; i += 1) {
          const chunk = await SecureStore.getItemAsync(`${safeKey}__chunk_${i}`);
          if (chunk === null) return null;
          parts.push(chunk);
        }
        return parts.join('');
      }
    }
    return SecureStore.getItemAsync(safeKey);
  },

  async setItem(key: string, value: string): Promise<void> {
    const safeKey = sanitizeSecureStoreKey(key);
    await this.removeItem(key);

    if (value.length <= SECURE_STORE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(safeKey, value);
      return;
    }

    const totalChunks = Math.ceil(value.length / SECURE_STORE_CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i += 1) {
      const slice = value.slice(
        i * SECURE_STORE_CHUNK_SIZE,
        (i + 1) * SECURE_STORE_CHUNK_SIZE
      );
      await SecureStore.setItemAsync(`${safeKey}__chunk_${i}`, slice);
    }
    await SecureStore.setItemAsync(`${safeKey}__chunks`, String(totalChunks));
  },

  async removeItem(key: string): Promise<void> {
    const safeKey = sanitizeSecureStoreKey(key);
    const countRaw = await SecureStore.getItemAsync(`${safeKey}__chunks`);
    if (countRaw) {
      const count = parseInt(countRaw, 10);
      if (!Number.isNaN(count) && count > 0) {
        for (let i = 0; i < count; i += 1) {
          await SecureStore.deleteItemAsync(`${safeKey}__chunk_${i}`);
        }
      }
      await SecureStore.deleteItemAsync(`${safeKey}__chunks`);
    }
    await SecureStore.deleteItemAsync(safeKey);
  },
};

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  const validUrl =
    url && url.startsWith('http') ? url : 'https://placeholder-piams.supabase.co';
  const validKey =
    anonKey && anonKey !== 'your-supabase-anon-key' ? anonKey : 'placeholder-anon-key';

  clientInstance = createClient(validUrl, validKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return clientInstance;
}
