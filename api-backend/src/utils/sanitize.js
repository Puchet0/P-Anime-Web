/**
 * Input sanitization utilities for the backend.
 */

/**
 * Sanitize a string input.
 * Removes HTML tags, trims whitespace, enforces max length.
 */
function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/\s+/g, ' ') // collapse whitespace
    .slice(0, maxLength);
}

/**
 * Sanitize a filename to prevent path traversal.
 * Only allows alphanumeric, dash, underscore, and specific extensions.
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return '';
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '') // only safe chars
    .replace(/\.{2,}/g, '.') // no double dots
    .slice(0, 255); // max length
}

/**
 * Sanitize a URL.
 * Validates it's a proper HTTP/HTTPS URL and strips dangerous characters.
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString().slice(0, 2048);
  } catch {
    return '';
  }
}

/**
 * Sanitize an object's string values recursively.
 */
function sanitizeObject(obj, maxDepth = 3) {
  if (maxDepth <= 0) return obj;
  if (!obj || typeof obj !== 'object') return sanitizeString(String(obj));

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = {
  sanitizeString,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeObject,
};
