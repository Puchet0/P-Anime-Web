import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content from external sources (AniList, scraping).
 * Strips all dangerous elements while keeping safe formatting.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text input from users.
 * Removes HTML tags, trims whitespace, enforces max length.
 */
export function sanitizeInput(input: string, maxLength = 500): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[^\S]+/g, ' ') // collapse whitespace
    .slice(0, maxLength);
}
