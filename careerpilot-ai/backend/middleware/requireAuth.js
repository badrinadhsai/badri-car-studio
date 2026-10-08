// Authentication middleware — verifies the Supabase JWT on protected routes.
// Identity ALWAYS comes from the verified token (req.user.id). A user_id sent
// in the request body is never trusted for ownership decisions.
//
// When Supabase is not configured (fresh clone before setup), the middleware
// passes through with req.user = null and a warning header so existing local
// development and health checks keep working. Once SUPABASE_URL +
// SUPABASE_ANON_KEY are set, unauthenticated AI calls are rejected with 401.
const { isSupabaseConfigured, verifyAccessToken } = require('../services/supabase');

function unauthorized(res, expired) {
  return res.status(401).json({
    success: false,
    error: {
      code: 'NOT_AUTHENTICATED',
      message: expired
        ? 'Your session has expired. Please log in again.'
        : 'Please log in to use this feature.'
    }
  });
}

async function requireAuth(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      req.user = null;
      req.authSkipped = true;
      res.setHeader('X-CareerPilot-Auth', 'skipped-not-configured');
      return next();
    }
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match ? match[1].trim() : '';
    if (!token) return unauthorized(res, false);
    const user = await verifyAccessToken(token);
    if (!user) return unauthorized(res, true);
    req.user = { id: user.id, email: user.email || null };
    return next();
  } catch {
    return unauthorized(res, true);
  }
}

module.exports = { requireAuth };
