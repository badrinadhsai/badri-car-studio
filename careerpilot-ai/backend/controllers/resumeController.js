const { requireResumeInput, str } = require('../utils/validate');
const { extractTextFromPdfBuffer } = require('../utils/pdf');
const analysisService = require('../services/analysisService');

async function improveResume(req, res, next) {
  try {
    const { resumeText } = requireResumeInput(req.body, req.file);
    const text = req.file && req.file.buffer ? await extractTextFromPdfBuffer(req.file.buffer) : resumeText;
    if (!text || text.length < 50) {
      const err = new Error('Provide resume text or a readable PDF to improve.');
      err.statusCode = 400; err.code = 'MISSING_RESUME'; throw err;
    }
    const targetRole = str(req.body.targetRole, 200) || undefined;
    const improvement = await analysisService.runResumeImprovement({ resumeText: text, targetRole });
    res.json({ success: true, data: { improvement } });
  } catch (e) { next(e); }
}

module.exports = { improveResume };
