// Centralized error handling — never leak stack traces or resume contents to clients.
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` }
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Multer / PDF validation errors carry .statusCode
  let status = err.statusCode || err.status || 500;
  let code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  // Multer 2.x raises MulterError (no .statusCode) for limit violations —
  // map to client errors with friendly messages instead of a 500.
  if (err && err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      code = 'FILE_TOO_LARGE';
      err.message = 'Resume PDF is too large. Maximum size is 5 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      code = 'INVALID_UPLOAD';
      err.message = 'Unexpected upload field. Attach the resume as “resumeFile”.';
    } else {
      code = 'INVALID_UPLOAD';
      err.message = 'Invalid file upload. Please attach a valid PDF resume.';
    }
  }

  // Never log full resume text. Log only a short prefix-free summary.
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[api-error] ${req.method} ${req.path} -> ${status} ${code}`);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message: status === 500 ? 'Something went wrong. Please try again.' : (err.message || 'Request failed.')
    }
  });
}

module.exports = { notFound, errorHandler };
