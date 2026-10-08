const express = require('express');
const { generateQuestions, evaluateAnswer, chatTurn, evaluateSession } = require('../controllers/interviewController');
const { pdfUploadIfMultipart } = require('../middleware/upload');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// pdfUpload is a no-op for JSON bodies; it enables optional resume-PDF context on multipart calls.
// AI interview endpoints require a verified Supabase session.
router.post('/questions', requireAuth, pdfUploadIfMultipart, generateQuestions);
router.post('/evaluate', requireAuth, pdfUploadIfMultipart, evaluateAnswer);

// Conversational chatbot turns + final session report (JSON; existing
// rate limiting and error handling apply unchanged).
router.post('/chat', requireAuth, chatTurn);
router.post('/evaluate-session', requireAuth, evaluateSession);

module.exports = router;

