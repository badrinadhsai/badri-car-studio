// CareerPilot AI — production LLM service (server-side only).
// OpenAI-compatible chat-completions provider via environment configuration.
// The API key never leaves this process: never returned, never logged,
// never sent anywhere except the configured provider's Authorization header.

const DEFAULT_TIMEOUT_FULL_MS = 90000;
const DEFAULT_TIMEOUT_MS = 60000;
const MAX_TOKENS = 4000;
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function isLLMConfigured() {
  return Boolean((process.env.LLM_API_KEY || '').trim());
}

function getConfig() {
  const apiKey = (process.env.LLM_API_KEY || '').trim();
  if (!apiKey) {
    const err = new Error('AI analysis is not configured. Please configure the server-side LLM provider.');
    err.statusCode = 503;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
  const baseUrlRaw = (process.env.LLM_BASE_URL || '').trim().replace(/\/+$/, '');
  const model = (process.env.LLM_MODEL || '').trim();
  if (!baseUrlRaw || !/^https?:\/\/.+/i.test(baseUrlRaw)) {
    const err = new Error('AI provider base URL is missing or invalid. Set LLM_BASE_URL server-side.');
    err.statusCode = 503;
    err.code = 'AI_CONFIG_ERROR';
    throw err;
  }
  // Provider-specific normalization (documented in .env.example): Google's
  // Generative Language API exposes its OpenAI-compatible chat-completions
  // interface under an `/openai` path segment, so append it when missing.
  // The request architecture itself stays provider-agnostic.
  let baseUrl = baseUrlRaw;
  try {
    const u = new URL(baseUrlRaw);
    if (
      u.hostname.toLowerCase() === 'generativelanguage.googleapis.com' &&
      !/\/openai(\/|$)/i.test(u.pathname)
    ) {
      u.pathname = `${u.pathname}/openai`.replace(/\/{2,}/g, '/');
      baseUrl = u.toString().replace(/\/+$/, '');
    }
  } catch {
    // URL already passed the https?:// regex above; keep it as-is.
  }
  if (!model) {
    const err = new Error('AI model is not specified. Set LLM_MODEL server-side.');
    err.statusCode = 503;
    err.code = 'AI_CONFIG_ERROR';
    throw err;
  }
  return { apiKey, baseUrl, model };
}

function llmConfig() {
  // Safe for health checks: exposes booleans and non-secret identifiers only.
  return {
    configured: isLLMConfigured(),
    baseUrl: (process.env.LLM_BASE_URL || '').trim() || null,
    model: (process.env.LLM_MODEL || '').trim() || null
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapProviderError(status, bodyText) {
  // Never include provider body details that could leak account info; categorize only.
  if (status === 401 || status === 403) {
    const err = new Error('AI provider rejected the server credentials. Check the server-side API key.');
    err.statusCode = 503;
    err.code = 'AI_PROVIDER_AUTH';
    return err;
  }
  if (status === 429) {
    const err = new Error('AI provider is rate-limited right now. Please try again in a moment.');
    err.statusCode = 429;
    err.code = 'AI_RATE_LIMITED';
    return err;
  }
  if (status === 404) {
    const err = new Error('AI model or endpoint was not found. Check LLM_BASE_URL and LLM_MODEL.');
    err.statusCode = 503;
    err.code = 'AI_CONFIG_ERROR';
    return err;
  }
  const snippet = (bodyText || '').slice(0, 200);
  const err = new Error(`AI provider request failed (status ${status}).${snippet ? '' : ' Please try again.'}`);
  err.statusCode = 502;
  err.code = 'AI_PROVIDER_ERROR';
  return err;
}

async function postChatCompletion({ system, user, maxTokens, temperature, timeoutMs }) {
  const { apiKey, baseUrl, model } = getConfig();
  const url = `${baseUrl}/chat/completions`;
  const timeout = Number(timeoutMs) || DEFAULT_TIMEOUT_MS;

  const payload = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: typeof temperature === 'number' ? temperature : 0.3,
    max_tokens: maxTokens || MAX_TOKENS,
    stream: false
  };

  let attempt = 0;
  const started = Date.now();
  for (;;) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        // One bounded retry for transient failures only.
        if (attempt === 1 && TRANSIENT_STATUSES.has(res.status)) {
          await sleep(800);
          continue;
        }
        throw mapProviderError(res.status, bodyText);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        const err = new Error('AI provider returned a non-JSON response.');
        err.statusCode = 502;
        err.code = 'AI_INVALID_RESPONSE';
        throw err;
      }
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        const err = new Error('AI provider returned an empty response. Please try again.');
        err.statusCode = 502;
        err.code = 'AI_EMPTY_RESPONSE';
        throw err;
      }
      return { content, durationMs: Date.now() - started, attempts: attempt, model };
    } catch (err) {
      clearTimeout(timer);
      if (err && (err.code === 'AI_PROVIDER_AUTH' || err.code === 'AI_RATE_LIMITED' || err.code === 'AI_CONFIG_ERROR' || err.code === 'AI_PROVIDER_ERROR' || err.code === 'AI_INVALID_RESPONSE' || err.code === 'AI_EMPTY_RESPONSE')) {
        throw err;
      }
      const isAbort = err && (err.name === 'AbortError' || err.name === 'TimeoutError');
      if (isAbort) {
        // Single bounded retry on timeout.
        if (attempt === 1) {
          await sleep(800);
          continue;
        }
        const timeoutErr = new Error('AI analysis timed out. Please try again with a shorter input.');
        timeoutErr.statusCode = 504;
        timeoutErr.code = 'AI_TIMEOUT';
        throw timeoutErr;
      }
      // Network-level failure: one bounded retry, then a controlled error.
      if (attempt === 1) {
        await sleep(800);
        continue;
      }
      const netErr = new Error('Could not reach the AI provider. Please try again later.');
      netErr.statusCode = 502;
      netErr.code = 'AI_PROVIDER_UNREACHABLE';
      throw netErr;
    }
  }
}

// Extract the JSON object from model output. Handles bare JSON, markdown fences,
// ```json fences, and leading/trailing prose. Never eval()s model output.
function extractJsonObject(text) {
  if (typeof text !== 'string' || !text.trim()) {
    const err = new Error('AI returned an empty response. Please try again.');
    err.statusCode = 502;
    err.code = 'AI_EMPTY_RESPONSE';
    throw err;
  }
  let cleaned = text.trim();
  // Strip all code fences, keeping the largest fenced block if present.
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) {
    const err = new Error('AI returned a response that could not be understood. Please try again.');
    err.statusCode = 502;
    err.code = 'AI_INVALID_RESPONSE';
    throw err;
  }
  let slice = cleaned.slice(start, end + 1);
  // Remove ASCII control characters that break JSON.parse, keep newlines/tabs.
  slice = slice.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  // Tolerate trailing commas before closing brackets.
  slice = slice.replace(/,\s*([}\]])/g, '$1');
  try {
    const parsed = JSON.parse(slice);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not-an-object');
    }
    return parsed;
  } catch {
    const err = new Error('AI returned a response that could not be understood. Please try again.');
    err.statusCode = 502;
    err.code = 'AI_INVALID_RESPONSE';
    throw err;
  }
}

// Safe observability: endpoint tag, prompt version, duration, outcome — never
// secrets, resumes, job descriptions, or response content.
function logAI(tag, promptVersion, outcome, details) {
  const extra = details ? ` ${details}` : '';
  console.log(`[CareerPilot] ${tag} ${promptVersion} ${outcome}${extra}`);
}

module.exports = {
  isLLMConfigured,
  getConfig,
  llmConfig,
  extractJsonObject,
  postChatCompletion,
  logAI,
  DEFAULT_TIMEOUT_FULL_MS,
  DEFAULT_TIMEOUT_MS
};
