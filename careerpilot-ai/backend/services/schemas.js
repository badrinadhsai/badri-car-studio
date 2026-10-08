// Runtime validation + normalization for AI output (no extra dependencies).
// Every validator throws a controlled 502 AI_INVALID_RESPONSE naming the bad field
// instead of letting malformed model output reach the frontend.
const { SCORE_WEIGHTS } = require('../prompts/_shared');

function invalid(field, why) {
  const err = new Error(`AI returned an invalid response (${field}: ${why}). Please try again.`);
  err.statusCode = 502;
  err.code = 'AI_INVALID_RESPONSE';
  throw err;
}

function cleanString(v, max = 2000) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

function requireString(obj, field, max = 2000) {
  const s = cleanString(obj[field], max);
  if (!s) invalid(field, 'missing or empty');
  return s;
}

// For already-extracted nested values (dotted labels are for messages only).
function requireValue(value, label, max = 2000) {
  const s = cleanString(value, max);
  if (!s) invalid(label, 'missing or empty');
  return s;
}

function stringArray(v, field, { maxItems = 30, maxLen = 500 } = {}) {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) invalid(field, 'expected an array');
  const out = [];
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const s = item.replace(/\s+/g, ' ').trim().slice(0, maxLen);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function scoreValue(v, field) {
  let n = v;
  if (typeof n === 'string' && /^\d+(\.\d+)?$/.test(n.trim())) n = Number(n.trim());
  if (typeof n !== 'number' || !Number.isFinite(n)) invalid(field, 'not a number');
  n = Math.round(n);
  if (n < 0 || n > 100) invalid(field, 'outside 0-100');
  return n;
}

function normalizePriority(p) {
  const s = String(p || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 'High';
  if (s === 'medium') return 'Medium';
  if (s === 'low') return 'Low';
  return 'Medium';
}

function normalizeMissingSkills(v) {
  if (!Array.isArray(v)) invalid('missingSkills', 'expected an array');
  const out = [];
  for (const m of v.slice(0, 20)) {
    if (typeof m === 'string' && m.trim()) {
      out.push({ skill: m.trim().slice(0, 120), priority: 'Medium', reason: '', currentEvidence: '', action: '' });
    } else if (m && typeof m === 'object') {
      const skill = cleanString(m.skill, 120);
      if (!skill) continue;
      if (!out.some((e) => e.skill.toLowerCase() === skill.toLowerCase())) {
        out.push({
          skill,
          priority: normalizePriority(m.priority),
          reason: cleanString(m.reason, 400),
          currentEvidence: cleanString(m.currentEvidence || m.evidence, 400),
          action: cleanString(m.action || m.recommendedAction, 400)
        });
      }
    }
  }
  return out;
}

function computeOverall(parts) {
  return Math.round(
    parts.resumeQuality * SCORE_WEIGHTS.resumeQuality +
    parts.technicalSkills * SCORE_WEIGHTS.technicalSkills +
    parts.jobMatch * SCORE_WEIGHTS.jobMatch +
    parts.projectsExperience * SCORE_WEIGHTS.projectsExperience +
    parts.interviewReadiness * SCORE_WEIGHTS.interviewReadiness
  );
}

// ---- Full analysis → exact frontend `analysis` contract ----
function validateFullAnalysis(obj) {
  if (!obj || typeof obj !== 'object') invalid('analysis', 'not an object');
  const b = obj.breakdown && typeof obj.breakdown === 'object' ? obj.breakdown : null;
  if (!b) invalid('breakdown', 'missing');
  const parts = {
    resumeQuality: scoreValue(b.resumeQuality, 'breakdown.resumeQuality'),
    technicalSkills: scoreValue(b.technicalSkills, 'breakdown.technicalSkills'),
    jobMatch: scoreValue(b.jobMatch, 'breakdown.jobMatch'),
    projectsExperience: scoreValue(b.projectsExperience, 'breakdown.projectsExperience'),
    interviewReadiness: scoreValue(b.interviewReadiness, 'breakdown.interviewReadiness')
  };
  const notes = obj.breakdownNotes && typeof obj.breakdownNotes === 'object' ? obj.breakdownNotes : {};
  const jm = obj.jobMatch && typeof obj.jobMatch === 'object' ? obj.jobMatch : null;
  if (!jm) invalid('jobMatch', 'missing');
  const stages = Array.isArray(obj.roadmap) ? obj.roadmap : invalid('roadmap', 'expected an array');
  if (stages.length === 0) invalid('roadmap', 'empty');

  return {
    readinessScore: computeOverall(parts),
    summary: requireString(obj, 'summary', 1200),
    breakdown: parts,
    breakdownNotes: {
      resumeQuality: cleanString(notes.resumeQuality, 300),
      technicalSkills: cleanString(notes.technicalSkills, 300),
      jobMatch: cleanString(notes.jobMatch, 300),
      projectsExperience: cleanString(notes.projectsExperience, 300),
      interviewReadiness: cleanString(notes.interviewReadiness, 300)
    },
    strengths: stringArray(obj.strengths, 'strengths', { maxItems: 10 }),
    weaknesses: stringArray(obj.weaknesses, 'weaknesses', { maxItems: 10 }),
    extractedSkills: stringArray(obj.extractedSkills, 'extractedSkills', { maxItems: 40 }),
    matchedSkills: stringArray(obj.matchedSkills, 'matchedSkills', { maxItems: 40 }),
    missingSkills: normalizeMissingSkills(obj.missingSkills),
    jobMatch: {
      score: scoreValue(jm.score, 'jobMatch.score'),
      matched: stringArray(jm.matched, 'jobMatch.matched'),
      missing: stringArray(jm.missing, 'jobMatch.missing'),
      evidence: stringArray(jm.evidence, 'jobMatch.evidence', { maxItems: 20, maxLen: 500 }),
      // jdSupplied/basis are finalized by analysisService from the actual request
      // input, so the UI statement is factual even if the model omits it.
      jdSupplied: jm.jdSupplied !== false,
      basis: cleanString(jm.basis, 400)
    },
    recommendations: stringArray(obj.recommendations, 'recommendations', { maxItems: 10 }),
    roadmap: stages.slice(0, 6).map((s, i) => {
      if (!s || typeof s !== 'object') invalid(`roadmap[${i}]`, 'not an object');
      return {
        title: requireValue(s.title, `roadmap[${i}].title`, 160),
        objective: cleanString(s.objective + (s.expectedOutcome ? ` Expected outcome: ${s.expectedOutcome}` : ''), 800),
        skills: stringArray(s.skills, `roadmap[${i}].skills`, { maxItems: 12 }),
        practice: stringArray(s.practice, `roadmap[${i}].practice`, { maxItems: 12 }),
        build: cleanString(s.build || s.project, 500),
        focus: cleanString(s.focus, 80)
      };
    }),
    scoreExplanation: cleanString(obj.scoreExplanation, 500)
  };
}

// ---- Modular validators ----
function validateResumeAnalysis(obj) {
  if (!obj || typeof obj !== 'object') invalid('resume', 'not an object');
  const p = obj.profile && typeof obj.profile === 'object' ? obj.profile : null;
  if (!p) invalid('profile', 'missing');
  return {
    summary: requireString(obj, 'summary', 1200),
    profile: {
      education: stringArray(p.education, 'profile.education'),
      skills: stringArray(p.skills, 'profile.skills', { maxItems: 40 }),
      projects: stringArray(p.projects, 'profile.projects'),
      certifications: stringArray(p.certifications, 'profile.certifications'),
      experience: stringArray(p.experience, 'profile.experience')
    },
    strengths: stringArray(obj.strengths, 'strengths', { maxItems: 10 }),
    weaknesses: stringArray(obj.weaknesses, 'weaknesses', { maxItems: 10 }),
    improvementOpportunities: stringArray(obj.improvementOpportunities, 'improvementOpportunities', { maxItems: 10 })
  };
}

function validateJobMatch(obj) {
  if (!obj || typeof obj !== 'object') invalid('jobMatch', 'not an object');
  const partial = Array.isArray(obj.partialMatches) ? obj.partialMatches : [];
  return {
    score: scoreValue(obj.jobMatchScore, 'jobMatchScore'),
    matched: stringArray(obj.matchedSkills, 'matchedSkills', { maxItems: 30 }),
    missing: stringArray(obj.missingSkills, 'missingSkills', { maxItems: 30 }),
    evidence: stringArray(obj.evidence, 'evidence', { maxItems: 20, maxLen: 500 }),
    partialMatches: partial.slice(0, 15).filter((x) => x && typeof x === 'object').map((x) => ({
      skill: cleanString(x.skill, 120),
      have: cleanString(x.have, 300),
      stillMissing: cleanString(x.stillMissing, 300)
    })).filter((x) => x.skill),
    requirements: stringArray(obj.requirements, 'requirements', { maxItems: 30 }),
    jdSupplied: obj.jdSupplied !== false,
    summary: requireString(obj, 'summary', 800)
  };
}

function validateSkillGap(obj) {
  if (!obj || typeof obj !== 'object') invalid('skillGap', 'not an object');
  const gaps = Array.isArray(obj.gaps) ? obj.gaps : invalid('gaps', 'expected an array');
  if (gaps.length === 0) invalid('gaps', 'empty');
  return {
    gaps: gaps.slice(0, 10).map((g, i) => {
      if (!g || typeof g !== 'object') invalid(`gaps[${i}]`, 'not an object');
      return {
        skill: requireValue(g.skill, `gaps[${i}].skill`, 120),
        category: cleanString(g.category, 80) || 'technical',
        priority: ['critical', 'high', 'medium', 'low'].includes(String(g.priority).toLowerCase())
          ? String(g.priority).toLowerCase() : 'medium',
        reason: cleanString(g.reason, 500),
        currentEvidence: cleanString(g.currentEvidence, 500),
        recommendedAction: cleanString(g.recommendedAction, 500)
      };
    }),
    summary: cleanString(obj.summary, 800)
  };
}

function validateRoadmap(obj) {
  if (!obj || typeof obj !== 'object') invalid('roadmap', 'not an object');
  const stages = Array.isArray(obj.stages) ? obj.stages : invalid('stages', 'expected an array');
  if (stages.length === 0) invalid('stages', 'empty');
  return {
    stages: stages.slice(0, 6).map((s, i) => {
      if (!s || typeof s !== 'object') invalid(`stages[${i}]`, 'not an object');
      return {
        title: requireValue(s.title, `stages[${i}].title`, 160),
        objective: cleanString(s.objective + (s.expectedOutcome ? ` Expected outcome: ${s.expectedOutcome}` : ''), 800),
        skills: stringArray(s.skills, `stages[${i}].skills`, { maxItems: 12 }),
        practice: stringArray(s.practice, `stages[${i}].practice`, { maxItems: 12 }),
        build: cleanString(s.build || s.project, 500),
        focus: cleanString(s.focus, 80)
      };
    }),
    totalFocus: cleanString(obj.totalFocus, 80)
  };
}

function validateQuestions(obj, requested) {
  if (!obj || typeof obj !== 'object') invalid('questions', 'not an object');
  const list = Array.isArray(obj.questions) ? obj.questions : invalid('questions', 'expected an array');
  if (list.length === 0) invalid('questions', 'empty');
  const allowedTypes = new Set(['technical', 'behavioral', 'project-based', 'situational']);
  const allowedDiff = new Set(['easy', 'medium', 'hard']);
  return {
    questions: list.slice(0, Math.min(Math.max(requested || 5, 1), 10)).map((q, i) => {
      if (!q || typeof q !== 'object') invalid(`questions[${i}]`, 'not an object');
      return {
        id: cleanString(q.id, 20) || `q${i + 1}`,
        question: requireValue(q.question, `questions[${i}].question`, 1000),
        type: allowedTypes.has(String(q.type).toLowerCase()) ? String(q.type).toLowerCase() : 'technical',
        difficulty: allowedDiff.has(String(q.difficulty).toLowerCase()) ? String(q.difficulty).toLowerCase() : 'medium'
      };
    })
  };
}

function validateEvaluation(obj) {
  if (!obj || typeof obj !== 'object') invalid('evaluation', 'not an object');
  return {
    score: scoreValue(obj.score, 'score'),
    strengths: stringArray(obj.strengths, 'strengths', { maxItems: 10 }),
    weaknesses: stringArray(obj.weaknesses, 'weaknesses', { maxItems: 10 }),
    missing: stringArray(obj.missing, 'missing', { maxItems: 10 }),
    improve: stringArray(obj.improve, 'improve', { maxItems: 10 }),
    structure: requireString(obj, 'structure', 1200)
  };
}

function validateImprovement(obj) {
  if (!obj || typeof obj !== 'object') invalid('improvement', 'not an object');
  const changes = Array.isArray(obj.changes) ? obj.changes : [];
  return {
    improvedText: requireString(obj, 'improvedText', 30000),
    changes: changes.slice(0, 20).filter((c) => c && typeof c === 'object').map((c) => ({
      area: cleanString(c.area, 160),
      whatChanged: cleanString(c.whatChanged, 500),
      why: cleanString(c.why, 500)
    })).filter((c) => c.area || c.whatChanged),
    summary: cleanString(obj.summary, 800)
  };
}

function validateChatTurn(obj) {
  if (!obj || typeof obj !== 'object') invalid('chatTurn', 'not an object');
  const ev = obj.evaluation && typeof obj.evaluation === 'object' ? obj.evaluation : null;
  if (!ev) invalid('evaluation', 'missing');
  const quality = String(obj.quality || '').toLowerCase();
  const nextType = String(obj.nextQuestionType || '').toLowerCase();
  return {
    message: requireString(obj, 'message', 2000),
    evaluation: {
      technicalAccuracy: scoreValue(ev.technicalAccuracy, 'evaluation.technicalAccuracy'),
      clarity: scoreValue(ev.clarity, 'evaluation.clarity'),
      depth: scoreValue(ev.depth, 'evaluation.depth'),
      relevance: scoreValue(ev.relevance, 'evaluation.relevance')
    },
    quality: ['strong', 'good', 'developing'].includes(quality) ? quality : 'good',
    nextQuestionType: ['follow-up', 'new-topic', 'closing'].includes(nextType) ? nextType : 'new-topic'
  };
}

function validateSessionEval(obj, questionCount) {
  if (!obj || typeof obj !== 'object') invalid('sessionEval', 'not an object');
  const list = Array.isArray(obj.questions) ? obj.questions : [];
  return {
    overallScore: scoreValue(obj.overallScore, 'overallScore'),
    technicalAccuracy: scoreValue(obj.technicalAccuracy, 'technicalAccuracy'),
    communication: scoreValue(obj.communication, 'communication'),
    problemSolving: scoreValue(obj.problemSolving, 'problemSolving'),
    technicalDepth: scoreValue(obj.technicalDepth, 'technicalDepth'),
    clarity: scoreValue(obj.clarity, 'clarity'),
    strengths: stringArray(obj.strengths, 'strengths', { maxItems: 6 }),
    improvements: stringArray(obj.improvements, 'improvements', { maxItems: 6 }),
    recommendations: stringArray(obj.recommendations, 'recommendations', { maxItems: 6 }),
    questions: list.slice(0, Math.min(Math.max(questionCount || 5, 1), 10)).map((q, i) => {
      if (!q || typeof q !== 'object') invalid(`questions[${i}]`, 'not an object');
      return {
        question: requireValue(q.question, `questions[${i}].question`, 1000),
        answer: cleanString(q.answer, 600),
        feedback: cleanString(q.feedback, 800),
        score: scoreValue(q.score, `questions[${i}].score`)
      };
    })
  };
}

module.exports = {
  validateFullAnalysis,
  validateResumeAnalysis,
  validateJobMatch,
  validateSkillGap,
  validateRoadmap,
  validateQuestions,
  validateEvaluation,
  validateImprovement,
  validateChatTurn,
  validateSessionEval,
  computeOverall
};
