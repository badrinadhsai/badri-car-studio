// Input validation helpers — all endpoints use these so behavior is consistent.

function str(v, max = 20000) {
  if (typeof v !== 'string') return '';
  return v.slice(0, max).trim();
}

function requireResumeInput(body, file) {
  const resumeText = str(body.resumeText, 30000);
  if (file && file.buffer && file.buffer.length > 0) return { mode: 'file', resumeText };
  if (resumeText.length >= 50) return { mode: 'text', resumeText };
  const err = new Error('Provide a PDF resume or paste resume text (minimum 50 characters).');
  err.statusCode = 400;
  err.code = 'MISSING_RESUME';
  throw err;
}

function requireRole(body) {
  const targetRole = str(body.targetRole, 200);
  if (!targetRole || targetRole.length < 2) {
    const err = new Error('Target role is required (e.g. "Frontend Developer").');
    err.statusCode = 400;
    err.code = 'MISSING_ROLE';
    throw err;
  }
  return targetRole;
}

function optionalText(v, max = 20000) {
  const s = str(v, max);
  return s || undefined;
}

module.exports = { str, requireResumeInput, requireRole, optionalText };
