// CareerPilot AI — server-side Supabase helpers (never imported by the frontend).
// Uses the anon key for JWT verification (auth.getUser) so the database RLS
// remains the enforcement boundary. The service-role key is optional and,
// when present, is only used for server-side verification fallback — never
// exposed to clients.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function verifierClient() {
  // Stateless client per verification: no session persistence server-side.
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function verifyAccessToken(token) {
  if (!isSupabaseConfigured()) return null;
  if (!token) return null;
  try {
    const { data, error } = await verifierClient().auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

module.exports = {
  isSupabaseConfigured,
  verifyAccessToken,
  // Exported for diagnostics only (never the secret values themselves).
  supabaseConfigStatus: () => ({
    configured: isSupabaseConfigured(),
    urlSet: Boolean(SUPABASE_URL),
    hasServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY)
  })
};
