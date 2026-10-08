// Live analysis controllers: validation + PDF extraction (unchanged) → real LLM.
// Response pattern preserved: { success: true, data: { analysis } } for /full;
// modular endpoints return their validated payloads under data.
const { requireResumeInput, requireRole, optionalText, str } = require('../utils/validate');
const { extractTextFromPdfBuffer } = require('../utils/pdf');
const analysisService = require('../services/analysisService');

async function resolveResumeText(req) {
  const { resumeText } = requireResumeInput(req.body, req.file);
  if (req.file && req.file.buffer) {
    return await extractTextFromPdfBuffer(req.file.buffer);
  }
  return resumeText;
}

function contextFrom(req, resumeText, targetRole) {
  return {
    resumeText,
    targetRole,
    experienceLevel: str(req.body.experienceLevel, 50) || undefined,
    jobDescription: optionalText(req.body.jobDescription)
  };
}

async function resumeAnalysis(req, res, next) {
  try {
    const resumeText = await resolveResumeText(req);
    const targetRole = requireRole(req.body);
    const resume = await analysisService.runResumeAnalysis({ resumeText, targetRole });
    res.json({ success: true, data: { resume, targetRole } });
  } catch (e) { next(e); }
}

async function jobMatch(req, res, next) {
  try {
    const resumeText = await resolveResumeText(req);
    const targetRole = requireRole(req.body);
    const jobDescription = optionalText(req.body.jobDescription);
    const jobMatch = await analysisService.runJobMatch({ resumeText, targetRole, jobDescription });
    res.json({ success: true, data: { jobMatch, targetRole, hasJobDescription: Boolean(jobDescription) } });
  } catch (e) { next(e); }
}

async function skillGap(req, res, next) {
  try {
    const resumeText = await resolveResumeText(req);
    const targetRole = requireRole(req.body);
    const jobDescription = optionalText(req.body.jobDescription);
    const skillGap = await analysisService.runSkillGap({ resumeText, targetRole, jobDescription });
    res.json({ success: true, data: { skillGap, targetRole, hasJobDescription: Boolean(jobDescription) } });
  } catch (e) { next(e); }
}

async function roadmap(req, res, next) {
  try {
    const resumeText = await resolveResumeText(req);
    const targetRole = requireRole(req.body);
    const jobDescription = optionalText(req.body.jobDescription);
    // Modular roadmap call works standalone: gaps are identified inline from the
    // skill-gap prompt input contract (resume + role + JD), then planned from.
    const gaps = `Candidate profile supplied (${resumeText.length} chars). Target role: ${targetRole}. ` +
      (jobDescription ? 'A job description was supplied; derive gaps from it.' : 'No JD supplied; use role-based expectations.');
    const roadmap = await analysisService.runRoadmap({
      resumeText,
      targetRole,
      gaps,
      requirements: jobDescription
    });
    res.json({ success: true, data: { roadmap, targetRole, hasJobDescription: Boolean(jobDescription) } });
  } catch (e) { next(e); }
}

async function unifiedAnalysis(req, res, next) {
  try {
    const resumeText = await resolveResumeText(req);
    const targetRole = requireRole(req.body);
    const ctx = contextFrom(req, resumeText, targetRole);
    const analysis = await analysisService.runFullAnalysis(ctx);
    res.json({
      success: true,
      data: {
        analysis,
        targetRole,
        hasJobDescription: Boolean(ctx.jobDescription)
      }
    });
  } catch (e) { next(e); }
}

module.exports = { resumeAnalysis, jobMatch, skillGap, roadmap, unifiedAnalysis };
