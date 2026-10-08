const { llmConfig } = require('../services/llmService');
const { supabaseConfigStatus } = require('../services/supabase');

function getHealth(req, res) {
  const cfg = llmConfig();
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'careerpilot-ai-backend',
      version: '0.1.0',
      // Non-secret identifiers only. Never the API key.
      llmConfigured: cfg.configured,
      llmModel: cfg.model,
      authConfigured: supabaseConfigStatus().configured,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { getHealth };
