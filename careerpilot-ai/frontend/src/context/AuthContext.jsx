import React from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthCtx = React.createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  configured: isSupabaseConfigured,
  signIn: async () => ({ error: 'NOT_CONFIGURED' }),
  signUp: async () => ({ error: 'NOT_CONFIGURED' }),
  signOut: async () => {},
  resetPassword: async () => ({ error: 'NOT_CONFIGURED' }),
  updatePassword: async () => ({ error: 'NOT_CONFIGURED' }),
  refreshProfile: async () => null,
  updateProfile: async () => ({ error: 'NOT_CONFIGURED' })
});

export function useAuth() {
  return React.useContext(AuthCtx);
}

function friendlyAuthError(err, fallback) {
  const msg = (err?.message || '').toLowerCase();
  if (!err) return null;
  if (err.code === 'NOT_CONFIGURED' || err.message === 'NOT_CONFIGURED') {
    return 'Authentication is not configured yet. Add your Supabase credentials (see SUPABASE_SETUP.md) and reload.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Email or password is incorrect.';
  }
  if (
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  ) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('email not confirmed') || msg.includes('email not verified') || msg.includes('confirm')) {
    return 'Please verify your email first — check your inbox for the confirmation link.';
  }
  if (msg.includes('invalid email') || msg.includes('valid email')) {
    return 'Please enter a valid email address.';
  }
  if (
    msg.includes('password') &&
    (msg.includes('short') || msg.includes('weak') || msg.includes('6 characters') ||
      msg.includes('at least') || msg.includes('compromised') || msg.includes('commonly used') ||
      msg.includes('pwned') || msg.includes('breach'))
  ) {
    return 'That password is too weak or unsafe to use. Choose a longer, unique password.';
  }
  if (msg.includes('signups not allowed') || msg.includes('signup is disabled') ||
    msg.includes('sign up is disabled') || msg.includes('not allowed for this instance')) {
    return 'New registrations are currently disabled. Please try again later.';
  }
  if (msg.includes('database error saving new user') || msg.includes('database error')) {
    return 'We could not create your account due to a server issue. Please try again in a moment.';
  }
  if (msg.includes('error sending confirmation email') || msg.includes('sending confirmation') ||
    msg.includes('confirmation email') || msg.includes('error sending email')) {
    return 'Your account was nearly ready, but the verification email could not be sent. Please try again in a few minutes.';
  }
  if (msg.includes('invalid api key') || msg.includes('api key not')) {
    return 'Authentication is temporarily unavailable. Please try again later.';
  }
  if (err.status === 404 || msg.includes('invalid path specified') || msg.includes('pgrst')) {
    return 'Could not reach the authentication service. Please check your connection and try again.';
  }
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over email send limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to')) {
    return 'Unable to connect right now. Please try again.';
  }
  return fallback || 'Something went wrong. Please try again.';
}

// Development diagnosis aid: logs non-sensitive error fields (status/code/
// message only — Supabase auth errors never contain tokens or passwords)
// so the REAL failure reason is visible in the browser console.
function logAuthError(action, err) {
  try {
    console.error(`[CareerPilot] auth ${action} failed`, {
      status: err?.status,
      code: err?.code,
      message: err?.message
    });
  } catch { /* logging must never break auth */ }
}

export function AuthProvider({ children }) {
  const [session, setSession] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchProfile = React.useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, target_role, experience_level, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      if (error) return null;
      setProfile(data || null);
      return data || null;
    } catch {
      return null;
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    async function init() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session || null);
        setUser(data.session?.user || null);
        if (data.session?.user) await fetchProfile(data.session.user.id);
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    if (!supabase) return () => { mounted = false; };
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      // On sign-out or user switch: clear private state FIRST so the next
      // user never briefly sees the previous user's data.
      if (event === 'SIGNED_OUT' || (nextSession?.user?.id && user && nextSession.user.id !== user.id)) {
        setProfile(null);
      }
      setSession(nextSession);
      setUser(nextSession?.user || null);
      setLoading(false);
      if (nextSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        await fetchProfile(nextSession.user.id);
      }
      if (event === 'SIGNED_OUT') setProfile(null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = React.useMemo(() => ({
    user,
    session,
    profile,
    loading,
    configured: isSupabaseConfigured,

    async signIn({ email, password }) {
      if (!supabase) return { error: friendlyAuthError({ message: 'NOT_CONFIGURED' }) };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logAuthError('signIn', error);
        return { error: friendlyAuthError(error) };
      }
      await fetchProfile(data.user?.id);
      return { data };
    },

    async signUp({ fullName, email, password }) {
      if (!supabase) return { error: friendlyAuthError({ message: 'NOT_CONFIGURED' }) };
      const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          ...(emailRedirectTo ? { emailRedirectTo } : {})
        }
      });
      if (error) {
        logAuthError('signUp', error);
        return { error: friendlyAuthError(error) };
      }
      // Profile row is created by the DB trigger. Only attempt the
      // client-side upsert when an authenticated session exists (email
      // confirmation OFF); without a session RLS correctly denies the write.
      if (data.user && data.session) {
        try {
          await supabase.from('profiles').upsert(
            { id: data.user.id, email, full_name: fullName },
            { onConflict: 'id' }
          );
        } catch { /* trigger owns creation; RLS still enforced */ }
        await fetchProfile(data.user.id);
      }
      return { data, needsConfirmation: !data.session };
    },

    async signOut() {
      // Clear private client state immediately, then destroy the session.
      setProfile(null);
      setUser(null);
      setSession(null);
      try {
        if (supabase) await supabase.auth.signOut();
      } catch { /* already cleared */ }
    },

    async resetPassword(email) {
      if (!supabase) return { error: friendlyAuthError({ message: 'NOT_CONFIGURED' }) };
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        logAuthError('resetPassword', error);
        return { error: friendlyAuthError(error, 'Could not send the reset email. Please try again.') };
      }
      return {};
    },

    async updatePassword(newPassword) {
      if (!supabase) return { error: friendlyAuthError({ message: 'NOT_CONFIGURED' }) };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        logAuthError('updatePassword', error);
        return { error: friendlyAuthError(error, 'Could not update your password. Please try again.') };
      }
      return {};
    },

    async refreshProfile() {
      if (!user) return null;
      return fetchProfile(user.id);
    },

    async updateProfile({ full_name, target_role, experience_level }) {
      if (!supabase || !user) return { error: 'You must be logged in.' };
      // Two-phase save: a bare UPDATE carries no RETURNING clause, so the
      // result reflects ONLY whether the write committed. A follow-up SELECT
      // then verifies persistence before reporting success — a write that
      // lands is never reported as a failure, and success is never claimed
      // without confirmation.
      const { error: writeError } = await supabase
        .from('profiles')
        .update({ full_name, target_role, experience_level, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (writeError) {
        logAuthError('updateProfile', writeError);
        return { error: 'Could not save your profile. Please try again.' };
      }
      const confirmed = await fetchProfile(user.id);
      if (
        !confirmed ||
        (confirmed.full_name || '') !== (full_name || '') ||
        (confirmed.target_role || null) !== (target_role || null) ||
        (confirmed.experience_level || '') !== (experience_level || '')
      ) {
        return { error: 'Your profile was saved, but we could not verify it. Please refresh the page to confirm.' };
      }
      return { data: confirmed };
    }
  }), [user, session, profile, loading, fetchProfile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
