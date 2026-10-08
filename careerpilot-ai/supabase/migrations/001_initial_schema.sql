-- CareerPilot AI — initial Supabase schema (non-destructive).
-- Run this ONCE in the Supabase Dashboard → SQL Editor → New query → Paste → Run.
-- It uses CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS so re-running is safe.
-- No data is deleted. RLS is enabled on every user-owned table.

-- ============================================================
-- 0. Helpers
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. profiles — one row per auth user, id = auth.users(id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  target_role TEXT,
  experience_level TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. analyses — structured career analysis results (no raw resume)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_role TEXT,
  experience_level TEXT,
  job_description TEXT,
  resume_text TEXT,
  readiness_score INTEGER NOT NULL DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  resume_quality_score INTEGER NOT NULL DEFAULT 0 CHECK (resume_quality_score BETWEEN 0 AND 100),
  technical_skills_score INTEGER NOT NULL DEFAULT 0 CHECK (technical_skills_score BETWEEN 0 AND 100),
  job_match_score INTEGER NOT NULL DEFAULT 0 CHECK (job_match_score BETWEEN 0 AND 100),
  projects_experience_score INTEGER NOT NULL DEFAULT 0 CHECK (projects_experience_score BETWEEN 0 AND 100),
  interview_readiness_score INTEGER NOT NULL DEFAULT 0 CHECK (interview_readiness_score BETWEEN 0 AND 100),
  skills JSONB NOT NULL DEFAULT '[]'::JSONB,
  matched_skills JSONB NOT NULL DEFAULT '[]'::JSONB,
  skill_gaps JSONB NOT NULL DEFAULT '[]'::JSONB,
  evidence JSONB NOT NULL DEFAULT '[]'::JSONB,
  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  roadmap JSONB NOT NULL DEFAULT '[]'::JSONB,
  full_result JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. resume_improvements
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resume_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_role TEXT,
  original_text TEXT NOT NULL,
  improved_text TEXT NOT NULL,
  changes JSONB NOT NULL DEFAULT '[]'::JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. interview_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_role TEXT,
  experience_level TEXT,
  interview_type TEXT NOT NULL DEFAULT 'Technical Interview',
  total_questions INTEGER NOT NULL DEFAULT 5 CHECK (total_questions BETWEEN 1 AND 20),
  overall_score INTEGER CHECK (overall_score IS NULL OR (overall_score BETWEEN 0 AND 100)),
  strengths JSONB NOT NULL DEFAULT '[]'::JSONB,
  improvements JSONB NOT NULL DEFAULT '[]'::JSONB,
  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 5. interview_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'user', 'system')),
  content TEXT NOT NULL,
  question_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. user_preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  default_target_role TEXT,
  default_experience_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. Indexes (user_id / created_at / session_id)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_impr_user_created ON public.resume_improvements (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_sess_user_created ON public.interview_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_msg_session ON public.interview_messages (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_interview_msg_user ON public.interview_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON public.user_preferences (user_id);

-- ============================================================
-- 8. updated_at triggers
-- ============================================================
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_prefs_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_prefs_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. Auto-create profile on signup (minimal, safe SECURITY DEFINER)
-- ============================================================
-- Needed because the trigger runs outside the new user's RLS context.
-- Kept minimal: fixed search_path, no dynamic SQL, INSERT-only.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 10. ROW LEVEL SECURITY — the real security boundary.
-- Every policy uses auth.uid(). No frontend filtering is trusted.
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ---- profiles: id = auth.uid() ----
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (id = auth.uid());

-- ---- analyses: user_id = auth.uid() ----
DROP POLICY IF EXISTS "analyses_select_own" ON public.analyses;
CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "analyses_insert_own" ON public.analyses;
CREATE POLICY "analyses_insert_own" ON public.analyses
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "analyses_update_own" ON public.analyses;
CREATE POLICY "analyses_update_own" ON public.analyses
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "analyses_delete_own" ON public.analyses;
CREATE POLICY "analyses_delete_own" ON public.analyses
  FOR DELETE USING (user_id = auth.uid());

-- ---- resume_improvements ----
DROP POLICY IF EXISTS "resume_impr_select_own" ON public.resume_improvements;
CREATE POLICY "resume_impr_select_own" ON public.resume_improvements
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "resume_impr_insert_own" ON public.resume_improvements;
CREATE POLICY "resume_impr_insert_own" ON public.resume_improvements
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "resume_impr_update_own" ON public.resume_improvements;
CREATE POLICY "resume_impr_update_own" ON public.resume_improvements
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "resume_impr_delete_own" ON public.resume_improvements;
CREATE POLICY "resume_impr_delete_own" ON public.resume_improvements
  FOR DELETE USING (user_id = auth.uid());

-- ---- interview_sessions ----
DROP POLICY IF EXISTS "interview_sess_select_own" ON public.interview_sessions;
CREATE POLICY "interview_sess_select_own" ON public.interview_sessions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "interview_sess_insert_own" ON public.interview_sessions;
CREATE POLICY "interview_sess_insert_own" ON public.interview_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "interview_sess_update_own" ON public.interview_sessions;
CREATE POLICY "interview_sess_update_own" ON public.interview_sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "interview_sess_delete_own" ON public.interview_sessions;
CREATE POLICY "interview_sess_delete_own" ON public.interview_sessions
  FOR DELETE USING (user_id = auth.uid());

-- ---- interview_messages: own rows AND own session ----
-- The session-ownership check stops a user from attaching messages to
-- someone else's session even if they guessed its UUID.
DROP POLICY IF EXISTS "interview_msg_select_own" ON public.interview_messages;
CREATE POLICY "interview_msg_select_own" ON public.interview_messages
  FOR SELECT USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_messages.session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "interview_msg_insert_own" ON public.interview_messages;
CREATE POLICY "interview_msg_insert_own" ON public.interview_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.interview_sessions s
      WHERE s.id = interview_messages.session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "interview_msg_delete_own" ON public.interview_messages;
CREATE POLICY "interview_msg_delete_own" ON public.interview_messages
  FOR DELETE USING (user_id = auth.uid());

-- ---- user_preferences ----
DROP POLICY IF EXISTS "user_prefs_select_own" ON public.user_preferences;
CREATE POLICY "user_prefs_select_own" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_prefs_insert_own" ON public.user_preferences;
CREATE POLICY "user_prefs_insert_own" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_prefs_update_own" ON public.user_preferences;
CREATE POLICY "user_prefs_update_own" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_prefs_delete_own" ON public.user_preferences;
CREATE POLICY "user_prefs_delete_own" ON public.user_preferences
  FOR DELETE USING (user_id = auth.uid());
