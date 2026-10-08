// Server-side PDF text extraction. No disk storage — buffer only, processed in-memory.
const pdfParse = require('pdf-parse');

async function extractTextFromPdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    const err = new Error('Uploaded PDF is empty.');
    err.statusCode = 400;
    err.code = 'EMPTY_FILE';
    throw err;
  }
  // Quick magic-number check: %PDF
  if (!(buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)) {
    const err = new Error('Invalid PDF file. Please upload a valid resume PDF.');
    err.statusCode = 400;
    err.code = 'INVALID_PDF';
    throw err;
  }
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();
    if (text.length < 50) {
      const err = new Error('Could not extract readable text from this PDF. Try pasting your resume text instead.');
      err.statusCode = 422;
      err.code = 'PDF_NO_TEXT';
      throw err;
    }
    return text.slice(0, 30000);
  } catch (e) {
    if (e.statusCode) throw e;
    const err = new Error('Could not read this PDF. It may be scanned/image-only. Paste resume text instead.');
    err.statusCode = 422;
    err.code = 'PDF_PARSE_FAILED';
    throw err;
  }
}

module.exports = { extractTextFromPdfBuffer };
