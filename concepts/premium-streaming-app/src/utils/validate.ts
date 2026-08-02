/**
 * Input validation utilities for user-facing forms.
 */

/**
 * Validate email format.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength.
 * Returns object with valid flag and list of error messages.
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos 1 letra mayúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos 1 número');
  }
  if (password.length > 128) {
    errors.push('Máximo 128 caracteres');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate username format.
 * 3-20 characters, alphanumeric + underscore only.
 */
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitize text input.
 * Removes HTML tags, trims whitespace, enforces max length.
 */
export function sanitizeTextInput(input: string, maxLength = 500): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/\s+/g, ' ') // collapse whitespace
    .slice(0, maxLength);
}

/**
 * Check for potential XSS patterns in input.
 * Returns true if suspicious content is detected.
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /onmouseover=/i,
    /onfocus=/i,
    /onblur=/i,
    /expression\(/i,
    /data:text\/html/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}
