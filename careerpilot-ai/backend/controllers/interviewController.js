const { str, optionalText } = require('../utils/validate');
const { extractTextFromPdfBuffer } = require('../utils/pdf');
const analysisService = require('../services/analysisService');

async function optionalResumeContext(req) {
  // JSON requests carry no file; multipart requests may include a resume PDF
  // and/or pasted text for profile-aware question generation. Never required.
  try {
    if (req.file && req.file.buffer) {
      const text = await extractTextFromPdfBuffer(req.file.buffer);
      return text.slice(0, 6000);
    }
  } catch {
    return undefined; // Unreadable PDF must not block question generation.
  }
  const pasted = optionalText(req.body.resumeText, 6000);
  return pasted;
}

async function generateQuestions(req, res, next) {
  try {
    const targetRole = str(req.body.targetRole, 200);
    if (!targetRole || targetRole.length < 2) {
      const err = new Error('Target role is required to generate interview questions.');
      err.statusCode = 400; err.code = 'MISSING_ROLE'; throw err;
    }
    const experienceLevel = str(req.body.experienceLevel, 50) || undefined;
    const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 10);
    const resumeText = await optionalResumeContext(req);
    const jobDescription = optionalText(req.body.jobDescription, 10000);
    const questions = await analysisService.runInterviewQuestions({
      targetRole, experienceLevel, count, resumeText, jobDescription
    });
    res.json({ success: true, data: { ...questions, targetRole } });
  } catch (e) { next(e); }
}

async function evaluateAnswer(req, res, next) {
  try {
    const question = str(req.body.question, 2000);
    const answer = str(req.body.answer, 10000);
    if (!question || !answer || answer.length < 10) {
      const err = new Error('Both question and a meaningful answer (10+ characters) are required.');
      err.statusCode = 400; err.code = 'MISSING_ANSWER'; throw err;
    }
    const targetRole = str(req.body.targetRole, 200) || undefined;
    const resumeText = await optionalResumeContext(req);
    const evaluation = await analysisService.runInterviewEvaluation({
      targetRole: targetRole || 'General',
      question, answer, resumeText
    });
    res.json({ success: true, data: { evaluation } });
  } catch (e) { next(e); }
}

// Conversational chatbot turn. History stays client-side; each call sends the
// bounded transcript so no session storage is needed server-side.
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw.slice(-30)) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'user' ? 'CANDIDATE' : 'INTERVIEWER';
    const content = str(m.content, 2000).slice(0, 2000);
    if (!content) continue;
    out.push(`${role}: ${content}`);
  }
  return out;
}

async function chatTurn(req, res, next) {
  try {
    const targetRole = str(req.body.targetRole, 200);
    if (!targetRole || targetRole.length < 2) {
      const err = new Error('Target role is required for the interview.');
      err.statusCode = 400; err.code = 'MISSING_ROLE'; throw err;
    }
    const experienceLevel = str(req.body.experienceLevel, 50) || undefined;
    const totalQuestions = Math.min(Math.max(Number(req.body.totalQuestions) || 5, 1), 10);
    const questionNumber = Math.min(Math.max(Number(req.body.questionNumber) || 1, 1), 20);
    const lines = cleanMessages(req.body.messages);
    const history = lines.join('\n').slice(0, 12000);
    const turn = await analysisService.runInterviewChat({
      targetRole, experienceLevel, history, questionNumber, totalQuestions
    });
    // Completion is decided server-side from the agreed question count,
    // never left to model discretion.
    const isComplete = questionNumber >= totalQuestions;
    res.json({
      success: true,
      data: { ...turn, questionNumber, totalQuestions, isComplete }
    });
  } catch (e) { next(e); }
}

async function evaluateSession(req, res, next) {
  try {
    const targetRole = str(req.body.targetRole, 200);
    if (!targetRole || targetRole.length < 2) {
      const err = new Error('Target role is required to evaluate the session.');
      err.statusCode = 400; err.code = 'MISSING_ROLE'; throw err;
    }
    const experienceLevel = str(req.body.experienceLevel, 50) || undefined;
    const lines = cleanMessages(req.body.messages);
    if (lines.length < 2) {
      const err = new Error('Not enough conversation to evaluate yet.');
      err.statusCode = 400; err.code = 'SESSION_TOO_SHORT'; throw err;
    }
    const transcript = lines.join('\n').slice(0, 15000);
    const questionCount = lines.filter((l) => l.startsWith('INTERVIEWER:')).length;
    const report = await analysisService.runSessionEval({
      targetRole, experienceLevel, transcript, questionCount
    });
    res.json({ success: true, data: { report } });
  } catch (e) { next(e); }
}

module.exports = { generateQuestions, evaluateAnswer, chatTurn, evaluateSession };
