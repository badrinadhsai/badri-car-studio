// CareerPilot AI — frontend Supabase client (public anon key only).
// Never put service-role keys, Gemini keys, or secrets here.
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing, `supabase`
// is null and auth features degrade gracefully with a setup notice.
import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'cp-supabase-auth'
      }
    })
  : null;
