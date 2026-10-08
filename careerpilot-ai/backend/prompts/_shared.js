// Shared prompt-engineering contract. Every prompt module follows:
// ROLE / CONTEXT / TASK / CONSTRAINTS / OUTPUT SCHEMA / QUALITY RULES / SAFETY RULES.
// Each module exports { name, version, system, buildUser(...), outputShape }.

const ANTI_HALLUCINATION = `ACCURACY / SAFETY RULES:
- Use ONLY information present in the supplied resume text, target role, and job description.
- NEVER invent qualifications, work experience, projects, certifications, skills, achievements, metrics, employers, or dates.
- NEVER assume a skill merely because a related skill appears. Related is not identical.
- Clearly distinguish EVIDENCE (directly stated) from INFERENCE (reasonable reading, labeled as such).
- If information is missing, say so explicitly and mark fields as "not stated".
- All results are career guidance, NOT guaranteed hiring outcomes. Scores are guidance metrics only, never hiring probabilities.`;

const JSON_ONLY = `OUTPUT RULES:
- Return ONLY valid JSON matching OUTPUT SCHEMA. No markdown, no code fences, no commentary, no text outside the JSON object.
- Keep language concise, professional, and student-friendly.
- All scores are integers from 0 to 100.`;

// Career-readiness weighting (guidance metric, not a hiring probability).
// The backend recomputes the overall score from these weights; the model must
// still return each component honestly.
const SCORE_WEIGHTS = {
  resumeQuality: 0.2,
  technicalSkills: 0.25,
  jobMatch: 0.2,
  projectsExperience: 0.15,
  interviewReadiness: 0.2
};

const PROMPT_VERSIONS = {
  fullAnalysis: 'full-analysis-v2',
  resumeAnalysis: 'resume-analysis-v1',
  jobMatch: 'job-match-v1',
  skillGap: 'skill-gap-v1',
  roadmap: 'roadmap-v1',
  interviewQuestions: 'interview-questions-v1',
  interviewEvaluation: 'interview-evaluation-v1',
  interviewChat: 'interview-chat-v1',
  interviewSessionEval: 'interview-session-eval-v1',
  resumeImprovement: 'resume-improvement-v2'
};

module.exports = { ANTI_HALLUCINATION, JSON_ONLY, SCORE_WEIGHTS, PROMPT_VERSIONS };
