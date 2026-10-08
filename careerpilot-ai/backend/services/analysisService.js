// Orchestration: prompt → real LLM call → JSON extraction → validation.
// Modular prompt services are retained as independent units; the full analysis
// uses one carefully designed call covering all core dashboard fields.
const {
  postChatCompletion,
  extractJsonObject,
  logAI,
  DEFAULT_TIMEOUT_FULL_MS,
  DEFAULT_TIMEOUT_MS
} = require('./llmService');
const schemas = require('./schemas');
const fullAnalysisPrompt = require('../prompts/fullAnalysis');
const resumePrompt = require('../prompts/resumeAnalysis');
const jobMatchPrompt = require('../prompts/jobMatch');
const skillGapPrompt = require('../prompts/skillGap');
const roadmapPrompt = require('../prompts/careerRoadmap');
const questionsPrompt = require('../prompts/interviewQuestions');
const evaluationPrompt = require('../prompts/interviewEvaluation');
const chatPrompt = require('../prompts/interviewChat');
const sessionEvalPrompt = require('../prompts/interviewSessionEval');
const improvementPrompt = require('../prompts/resumeImprovement');

function timeoutFor(kind) {
  const env = Number(process.env.LLM_TIMEOUT_MS);
  if (Number.isFinite(env) && env > 0) return Math.min(env, 180000);
  return kind === 'full' ? DEFAULT_TIMEOUT_FULL_MS : DEFAULT_TIMEOUT_MS;
}

async function runPrompt({ tag, prompt, userArgs, validate, timeoutKind, temperature }) {
  const started = Date.now();
  // Safe log: sizes only, never content.
  const inputChars = JSON.stringify(userArgs, (k, v) => (typeof v === 'string' ? v.length : v));
  logAI(tag, prompt.version, 'started', `input-sizes=${inputChars}`);
  try {
    const user = prompt.buildUser(userArgs);
    const { content, durationMs, attempts, model } = await postChatCompletion({
      system: prompt.system,
      user,
      temperature,
      timeoutMs: timeoutFor(timeoutKind)
    });
    const parsed = extractJsonObject(content);
    const normalized = validate(parsed);
    logAI(tag, prompt.version, 'completed', `model=${model} durationMs=${durationMs} attempts=${attempts} totalMs=${Date.now() - started}`);
    return normalized;
  } catch (err) {
    const category = err.code || 'UNKNOWN';
    logAI(tag, prompt.version, 'failed', `error=${category} totalMs=${Date.now() - started}`);
    throw err;
  }
}

async function runFullAnalysis({ resumeText, targetRole, experienceLevel, jobDescription }) {
  const analysis = await runPrompt({
    tag: 'full-analysis',
    prompt: fullAnalysisPrompt,
    userArgs: { resumeText, targetRole, experienceLevel, jobDescription },
    validate: schemas.validateFullAnalysis,
    timeoutKind: 'full',
    temperature: 0.3
  });
  // Ground the matching-basis statement in the actual request input, not just
  // the model's word: the server knows whether a JD was supplied.
  const jdSupplied = Boolean(jobDescription);
  analysis.jobMatch.jdSupplied = jdSupplied;
  if (!analysis.jobMatch.basis) {
    analysis.jobMatch.basis = jdSupplied
      ? 'Matched directly against the supplied job description.'
      : 'Role-based matching: no job description was supplied, so requirements reflect typical expectations for this role.';
  }
  return analysis;
}

function runResumeAnalysis({ resumeText, targetRole }) {
  return runPrompt({
    tag: 'resume-analysis',
    prompt: resumePrompt,
    userArgs: { resumeText, targetRole },
    validate: schemas.validateResumeAnalysis,
    timeoutKind: 'modular',
    temperature: 0.3
  });
}

function runJobMatch({ resumeText, targetRole, jobDescription }) {
  return runPrompt({
    tag: 'job-match',
    prompt: jobMatchPrompt,
    userArgs: { resumeText, targetRole, jobDescription },
    validate: schemas.validateJobMatch,
    timeoutKind: 'modular',
    temperature: 0.3
  });
}

function runSkillGap({ resumeText, targetRole, jobDescription, jobMatchFindings }) {
  return runPrompt({
    tag: 'skill-gap',
    prompt: skillGapPrompt,
    userArgs: { resumeText, targetRole, jobDescription, jobMatchFindings },
    validate: schemas.validateSkillGap,
    timeoutKind: 'modular',
    temperature: 0.3
  });
}

function runRoadmap({ resumeText, targetRole, gaps, requirements }) {
  return runPrompt({
    tag: 'roadmap',
    prompt: roadmapPrompt,
    userArgs: { resumeText, targetRole, gaps, requirements },
    validate: schemas.validateRoadmap,
    timeoutKind: 'modular',
    temperature: 0.4
  });
}

function runInterviewQuestions({ targetRole, experienceLevel, count, resumeText, jobDescription }) {
  const n = Math.min(Math.max(Number(count) || 5, 1), 10);
  return runPrompt({
    tag: 'interview-questions',
    prompt: questionsPrompt,
    userArgs: { targetRole, experienceLevel, count: n, resumeText, jobDescription },
    validate: (obj) => schemas.validateQuestions(obj, n),
    timeoutKind: 'modular',
    temperature: 0.6
  });
}

function runInterviewEvaluation({ targetRole, question, answer, resumeText }) {
  return runPrompt({
    tag: 'interview-evaluation',
    prompt: evaluationPrompt,
    userArgs: { targetRole, question, answer, resumeText },
    validate: schemas.validateEvaluation,
    timeoutKind: 'modular',
    temperature: 0.3
  });
}

function runResumeImprovement({ resumeText, targetRole }) {
  return runPrompt({
    tag: 'resume-improvement',
    prompt: improvementPrompt,
    userArgs: { resumeText, targetRole },
    validate: schemas.validateImprovement,
    timeoutKind: 'modular',
    temperature: 0.3
  });
}

function runInterviewChat({ targetRole, experienceLevel, history, questionNumber, totalQuestions }) {
  return runPrompt({
    tag: 'interview-chat',
    prompt: chatPrompt,
    userArgs: { targetRole, experienceLevel, history, questionNumber, totalQuestions },
    validate: schemas.validateChatTurn,
    timeoutKind: 'modular',
    temperature: 0.7
  });
}

function runSessionEval({ targetRole, experienceLevel, transcript, questionCount }) {
  return runPrompt({
    tag: 'interview-session-eval',
    prompt: sessionEvalPrompt,
    userArgs: { targetRole, experienceLevel, transcript },
    validate: (obj) => schemas.validateSessionEval(obj, questionCount),
    timeoutKind: 'full',
    temperature: 0.3
  });
}

module.exports = {
  runFullAnalysis,
  runResumeAnalysis,
  runJobMatch,
  runSkillGap,
  runRoadmap,
  runInterviewQuestions,
  runInterviewEvaluation,
  runResumeImprovement,
  runInterviewChat,
  runSessionEval
};
