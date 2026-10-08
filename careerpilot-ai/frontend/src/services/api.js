// Centralized API client — all backend calls go through here.
// No secrets live in the frontend; every function calls the same-origin backend.
//
// STEP-3 CONTRACT (backend will return this shape; UI already consumes it):
//   { success: true, data: { analysis: {
//       readinessScore, summary, breakdown: { resumeQuality, technicalSkills,
//         jobMatch, projectsExperience, interviewReadiness },
//       strengths[], weaknesses[], extractedSkills[], matchedSkills[],
//       missingSkills[{skill, priority}], jobMatch: { score, matched[], missing[], evidence[] },
//       recommendations[], roadmap[{ title, objective, skills[], practice[], build, focus }],
//       interview: { readiness, notes } } } }
// When the server-side LLM is not configured, AI endpoints return 503
// AI_NOT_CONFIGURED and /api/health reports llmConfigured:false.

import { supabase } from '../lib/supabase';

const BASE = '';

export const AI_NOT_CONFIGURED = 'AI_NOT_CONFIGURED';
export const NOT_AUTHENTICATED = 'NOT_AUTHENTICATED';

// Supabase access token attached to every backend call so the server can
// verify the caller's identity (session persists via the Supabase client).
async function authHeaders(extra = {}) {
  try {
    if (!supabase) return { ...extra };
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return { ...extra, Authorization: `Bearer ${token}` };
  } catch {
    // No session — backend will answer 401 with a human-readable message.
  }
  return { ...extra };
}

async function parse(res) {
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) {
    const msg = body?.error?.message || `Request failed (${res.status}).`;
    const err = new Error(
      res.status === 401
        ? 'Your session has expired. Please log in again.'
        : msg
    );
    err.code = body?.error?.code || (res.status === 401 ? NOT_AUTHENTICATED : undefined);
    err.status = res.status;
    throw err;
  }
  return body;
}

function friendlyError(err) {
  if (err.code === AI_NOT_CONFIGURED) {
    return 'The AI engine is not configured on the server. Your input was validated successfully — configure the server-side LLM provider and try again.';
  }
  if (err.code === NOT_AUTHENTICATED || err.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  if (err.status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (err instanceof TypeError) return 'Network failure. Check your connection and that the backend is running.';
  return err.message || 'Request failed. Please try again.';
}

function resumeForm({ resumeFile, resumeText, targetRole, jobDescription, experienceLevel }) {
  const form = new FormData();
  if (resumeFile) form.append('resumeFile', resumeFile);
  if (resumeText) form.append('resumeText', resumeText);
  if (targetRole) form.append('targetRole', targetRole);
  if (jobDescription) form.append('jobDescription', jobDescription);
  if (experienceLevel) form.append('experienceLevel', experienceLevel);
  return form;
}

export async function getHealth() {
  const res = await fetch(`${BASE}/api/health`);
  return parse(res);
}

export async function postFullAnalysis(payload) {
  const res = await fetch(`${BASE}/api/analyze/full`, { method: 'POST', headers: await authHeaders(), body: resumeForm(payload) });
  return parse(res);
}

export async function analyzeResume(payload) {
  const res = await fetch(`${BASE}/api/analyze/resume`, { method: 'POST', headers: await authHeaders(), body: resumeForm(payload) });
  return parse(res);
}

export async function analyzeJobMatch(payload) {
  const res = await fetch(`${BASE}/api/analyze/job-match`, { method: 'POST', headers: await authHeaders(), body: resumeForm(payload) });
  return parse(res);
}

export async function analyzeSkillGap(payload) {
  const res = await fetch(`${BASE}/api/analyze/skill-gap`, { method: 'POST', headers: await authHeaders(), body: resumeForm(payload) });
  return parse(res);
}

export async function analyzeRoadmap(payload) {
  const res = await fetch(`${BASE}/api/analyze/roadmap`, { method: 'POST', headers: await authHeaders(), body: resumeForm(payload) });
  return parse(res);
}

export async function improveResume(payload) {
  const res = await fetch(`${BASE}/api/resume/improve`, { method: 'POST', headers: await authHeaders(), body: resumeForm(payload) });
  return parse(res);
}

export async function getInterviewQuestions({ targetRole, experienceLevel, count = 5 }) {
  const res = await fetch(`${BASE}/api/interview/questions`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ targetRole, experienceLevel, count })
  });
  return parse(res);
}

export async function evaluateInterviewAnswer({ question, answer, targetRole }) {
  const res = await fetch(`${BASE}/api/interview/evaluate`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ question, answer, targetRole })
  });
  return parse(res);
}

export async function postInterviewChat({ targetRole, experienceLevel, messages, questionNumber, totalQuestions }) {
  const res = await fetch(`${BASE}/api/interview/chat`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ targetRole, experienceLevel, messages, questionNumber, totalQuestions })
  });
  return parse(res);
}

export async function postInterviewSessionEval({ targetRole, experienceLevel, messages }) {
  const res = await fetch(`${BASE}/api/interview/evaluate-session`, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ targetRole, experienceLevel, messages })
  });
  return parse(res);
}

export { friendlyError };
