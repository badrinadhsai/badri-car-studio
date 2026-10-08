require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const healthRoutes = require('./routes/health');
const analyzeRoutes = require('./routes/analyze');
const interviewRoutes = require('./routes/interview');
const resumeRoutes = require('./routes/resume');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// --- middleware ---
app.use(cors({ origin: CLIENT_URL.split(','), credentials: false }));
app.use(express.json({ limit: '1mb' })); // resume text + JD stay small; files go via multer
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Basic abuse protection for LLM-backed endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }
});
app.use('/api/', apiLimiter);

// --- routes ---
app.use('/api/health', healthRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/resume', resumeRoutes);

// Root hint (no secrets, no resume logging)
app.get('/', (req, res) => {
  res.json({ success: true, data: { name: 'CareerPilot AI API', version: '0.1.0', docs: '/api/health' } });
});

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CareerPilot AI backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
