// CareerPilot AI — user data layer (Supabase, RLS-enforced).
// All queries are scoped to the authenticated user. RLS policies on every
// table enforce `user_id = auth.uid()` (or `id = auth.uid()` for profiles),
// so the database itself rejects cross-user access — frontend filtering is
// never the security boundary.
import { supabase } from '../lib/supabase';

function requireClient() {
  if (!supabase) {
    const err = new Error('Database is not configured. Add Supabase credentials first.');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }
  return supabase;
}

function friendlyDbError() {
  return 'Could not load your data right now. Please try again.';
}

// ---------- Analyses ----------

export async function saveAnalysis({ targetRole, experienceLevel, jobDescription, analysis }) {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw Object.assign(new Error('You must be logged in.'), { code: 'NOT_AUTHENTICATED' });
  const b = analysis?.breakdown || {};
  const row = {
    user_id: user.id,
    target_role: targetRole || null,
    experience_level: experienceLevel || null,
    job_description: jobDescription ? String(jobDescription).slice(0, 10000) : null,
    // Raw resume text is intentionally NOT stored — only structured results.
    resume_text: null,
    readiness_score: Number(analysis?.readinessScore) || 0,
    resume_quality_score: Number(b.resumeQuality) || 0,
    technical_skills_score: Number(b.technicalSkills) || 0,
    job_match_score: Number(analysis?.jobMatch?.score) || 0,
    projects_experience_score: Number(b.projectsExperience) || 0,
    interview_readiness_score: Number(b.interviewReadiness) || 0,
    skills: analysis?.extractedSkills || [],
    matched_skills: analysis?.matchedSkills || [],
    skill_gaps: analysis?.missingSkills || [],
    evidence: analysis?.jobMatch?.evidence || [],
    recommendations: analysis?.recommendations || [],
    roadmap: analysis?.roadmap || [],
    full_result: analysis
  };
  const { data, error } = await db.from('analyses').insert(row).select('id, created_at').single();
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_WRITE_FAILED' });
  return data;
}

export async function listAnalyses(limit = 20) {
  const db = requireClient();
  const { data, error } = await db
    .from('analyses')
    .select('id, target_role, experience_level, readiness_score, job_match_score, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  return data || [];
}

export async function getAnalysis(id) {
  const db = requireClient();
  const { data, error } = await db.from('analyses').select('*').eq('id', id).maybeSingle();
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  return data || null; // null when RLS denies access — never another user's row
}

// ---------- Resume improvements ----------

export async function saveResumeImprovement({ targetRole, originalText, improvement }) {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw Object.assign(new Error('You must be logged in.'), { code: 'NOT_AUTHENTICATED' });
  const row = {
    user_id: user.id,
    target_role: targetRole || null,
    original_text: String(originalText || '').slice(0, 20000),
    improved_text: String(improvement?.improvedText || '').slice(0, 20000),
    changes: improvement?.changes || [],
    summary: improvement?.summary || null
  };
  const { data, error } = await db.from('resume_improvements').insert(row).select('id, created_at').single();
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_WRITE_FAILED' });
  return data;
}

export async function listResumeImprovements(limit = 20) {
  const db = requireClient();
  const { data, error } = await db
    .from('resume_improvements')
    .select('id, target_role, summary, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  return data || [];
}

export async function getResumeImprovement(id) {
  const db = requireClient();
  const { data, error } = await db.from('resume_improvements').select('*').eq('id', id).maybeSingle();
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  return data || null;
}

// ---------- Interviews ----------

export async function createInterviewSession({ targetRole, experienceLevel, interviewType, totalQuestions }) {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw Object.assign(new Error('You must be logged in.'), { code: 'NOT_AUTHENTICATED' });
  const { data, error } = await db
    .from('interview_sessions')
    .insert({
      user_id: user.id,
      target_role: targetRole || null,
      experience_level: experienceLevel || null,
      interview_type: interviewType || 'Technical Interview',
      total_questions: totalQuestions || 5,
      completed: false
    })
    .select('id, created_at')
    .single();
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_WRITE_FAILED' });
  return data;
}

export async function saveInterviewMessage({ sessionId, role, content, questionNumber }) {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null; // history is best-effort; the interview itself must not break
  try {
    await db.from('interview_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role,
      content: String(content || '').slice(0, 4000),
      question_number: questionNumber || null
    });
  } catch {
    // Best-effort: never break an active interview over history persistence.
  }
  return null;
}

export async function completeInterviewSession({ sessionId, report }) {
  const db = requireClient();
  const { error } = await db
    .from('interview_sessions')
    .update({
      overall_score: Number(report?.overallScore) || null,
      strengths: report?.strengths || [],
      improvements: report?.improvements || [],
      recommendations: report?.recommendations || [],
      completed: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId);
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_WRITE_FAILED' });
}

export async function listInterviewSessions(limit = 20) {
  const db = requireClient();
  const { data, error } = await db
    .from('interview_sessions')
    .select('id, target_role, experience_level, interview_type, total_questions, overall_score, completed, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  return data || [];
}

export async function getInterviewSession(id) {
  const db = requireClient();
  const { data: session, error } = await db.from('interview_sessions').select('*').eq('id', id).maybeSingle();
  if (error) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  if (!session) return null;
  const { data: messages } = await db
    .from('interview_messages')
    .select('role, content, question_number, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true })
    .limit(100);
  return { session, messages: messages || [] };
}

// ---------- Preferences ----------

export async function getPreferences() {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
  return data || null;
}

export async function savePreferences(prefs) {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw Object.assign(new Error('You must be logged in.'), { code: 'NOT_AUTHENTICATED' });
  // Bare upsert (no RETURNING): the result reflects only whether the write
  // committed. A follow-up read then confirms persistence before reporting
  // success, so a landed write is never reported as a failure.
  const { error: writeError } = await db
    .from('user_preferences')
    .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (writeError) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_WRITE_FAILED' });
  const { data, error: readError } = await db
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (readError || !data) throw Object.assign(new Error(friendlyDbError()), { code: 'DB_READ_FAILED' });
  return data;
}
