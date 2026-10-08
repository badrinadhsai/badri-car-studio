const multer = require('multer');

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

function pdfFileFilter(req, file, cb) {
  const okMime = file.mimetype === 'application/pdf';
  const okName = /\.pdf$/i.test(file.originalname || '');
  if (okMime || okName) return cb(null, true);
  const err = new Error('Only PDF files are supported. Please upload a .pdf resume.');
  err.statusCode = 415;
  err.code = 'UNSUPPORTED_FILE';
  return cb(err);
}

const pdfUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: pdfFileFilter
}).single('resumeFile');

// Multer 2.x resets req.body on non-multipart requests, which would wipe the
// JSON already parsed by express.json(). Skip multer entirely unless the
// request is actually multipart, preserving both JSON and file-upload flows.
function pdfUploadIfMultipart(req, res, next) {
  if (req.is('multipart/*')) return pdfUpload(req, res, next);
  return next();
}

module.exports = { pdfUpload, pdfUploadIfMultipart, MAX_BYTES };
