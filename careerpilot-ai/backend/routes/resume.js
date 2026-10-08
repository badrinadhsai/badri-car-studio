const express = require('express');
const { improveResume } = require('../controllers/resumeController');
const { pdfUploadIfMultipart } = require('../middleware/upload');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/improve', requireAuth, pdfUploadIfMultipart, improveResume);

module.exports = router;

