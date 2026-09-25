import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve from localStorage if set by user in Settings, or from env vars
const getSupabaseCredentials = () => {
  const customUrl = localStorage.getItem('chat_supabase_url');
  const customKey = localStorage.getItem('chat_supabase_anon_key');
  return {
    url: customUrl || (import.meta.env.VITE_SUPABASE_URL as string) || '',
    key: customKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  };
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
};

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (url) localStorage.setItem('chat_supabase_url', url);
  else localStorage.removeItem('chat_supabase_url');

  if (key) localStorage.setItem('chat_supabase_anon_key', key);
  else localStorage.removeItem('chat_supabase_anon_key');

  clientInstance = null;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
};
