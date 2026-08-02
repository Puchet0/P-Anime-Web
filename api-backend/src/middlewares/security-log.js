// Polyfill global WebSocket for Node < 22 (required by @supabase/realtime-js)
try {
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = require('ws');
  }
} catch {
  // ws not installed — realtime will fail, but client creation might still work if we skip realtime
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      realtime: { params: { eventsPerSecond: 0 } },
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn('[security-log] Supabase client init failed (logging will be disabled):', err.message);
  }
}

// Track failed attempts per IP for brute force detection
const failedAttempts = new Map();

function getFailedAttempts(ip) {
  const now = Date.now();
  const attempts = failedAttempts.get(ip) || [];
  // Keep only last 10 minutes
  const recent = attempts.filter(t => now - t < 10 * 60 * 1000);
  failedAttempts.set(ip, recent);
  return recent;
}

function recordFailedAttempt(ip) {
  const attempts = failedAttempts.get(ip) || [];
  attempts.push(Date.now());
  failedAttempts.set(ip, attempts);
}

/**
 * Detect brute force: >5 failed attempts in 10 minutes
 */
function isBruteForce(ip) {
  return getFailedAttempts(ip).length >= 5;
}

/**
 * Detect XSS attempts in input
 */
function detectXss(input) {
  if (!input || typeof input !== 'string') return false;
  const patterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /onmouseover=/i,
    /onfocus=/i,
    /expression\(/i,
    /data:text\/html/i,
  ];
  return patterns.some(p => p.test(input));
}

/**
 * Detect path traversal attempts
 */
function detectPathTraversal(input) {
  if (!input || typeof input !== 'string') return false;
  const patterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
    /\.\.%2f/i,
    /%2e%2e%2f/i,
    /\/etc\/passwd/i,
    /\/etc\/shadow/i,
    /\/proc\//i,
  ];
  return patterns.some(p => p.test(input));
}

/**
 * Log security event to Supabase
 */
async function logEvent({ eventType, severity, ipAddress, userAgent, endpoint, method, details }) {
  if (!supabase) return;

  try {
    await supabase.from('security_logs').insert({
      event_type: eventType,
      severity,
      ip_address: ipAddress,
      user_agent: userAgent,
      endpoint,
      method,
      details,
    });
  } catch {
    // Logging should never break the request
  }
}

/**
 * Middleware to log security events and detect attacks.
 */
function securityLogger(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || '';
  const endpoint = req.originalUrl || req.url;
  const method = req.method;

  // Check for path traversal in params
  const allParams = { ...req.params, ...req.query };
  for (const [key, value] of Object.entries(allParams)) {
    if (detectPathTraversal(value)) {
      logEvent({
        eventType: 'path_traversal',
        severity: 'critical',
        ipAddress: ip,
        userAgent,
        endpoint,
        method,
        details: { param: key, value: String(value).slice(0, 200) },
      });
      return res.status(400).json({ success: false, message: 'Solicitud inválida' });
    }
    if (detectXss(value)) {
      logEvent({
        eventType: 'xss_attempt',
        severity: 'critical',
        ipAddress: ip,
        userAgent,
        endpoint,
        method,
        details: { param: key, value: String(value).slice(0, 200) },
      });
      return res.status(400).json({ success: false, message: 'Solicitud inválida' });
    }
  }

  // Check for XSS in body
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    if (detectXss(bodyStr)) {
      logEvent({
        eventType: 'xss_attempt',
        severity: 'critical',
        ipAddress: ip,
        userAgent,
        endpoint,
        method,
        details: { body: bodyStr.slice(0, 200) },
      });
      return res.status(400).json({ success: false, message: 'Solicitud inválida' });
    }
  }

  // Attach logging helpers to request
  req.logSecurity = logEvent;
  req.securityIp = ip;

  // Check brute force for auth endpoints
  if (endpoint.includes('/auth') && isBruteForce(ip)) {
    logEvent({
      eventType: 'brute_force',
      severity: 'critical',
      ipAddress: ip,
      userAgent,
      endpoint,
      method,
      details: { attempts: getFailedAttempts(ip).length },
    });
    return res.status(429).json({ success: false, message: 'Demasiados intentos. Espera 10 minutos.' });
  }

  next();
}

/**
 * Log failed API key attempt
 */
async function logInvalidApiKey(req) {
  const ip = req.securityIp || req.ip || 'unknown';
  const userAgent = req.get('user-agent') || '';
  const endpoint = req.originalUrl || req.url;

  recordFailedAttempt(ip);

  await logEvent({
    eventType: 'invalid_api_key',
    severity: 'warning',
    ipAddress: ip,
    userAgent,
    endpoint,
    method: req.method,
  });
}

/**
 * Log rate limit hit
 */
async function logRateLimitHit(req) {
  const ip = req.securityIp || req.ip || 'unknown';
  const userAgent = req.get('user-agent') || '';
  const endpoint = req.originalUrl || req.url;

  await logEvent({
    eventType: 'rate_limit',
    severity: 'warning',
    ipAddress: ip,
    userAgent,
    endpoint,
    method: req.method,
  });
}

module.exports = {
  securityLogger,
  logInvalidApiKey,
  logRateLimitHit,
  detectXss,
  detectPathTraversal,
};
