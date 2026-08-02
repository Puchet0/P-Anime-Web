import { supabase, hasSupabase } from '../api/supabase';

type Severity = 'info' | 'warning' | 'critical';

interface SecurityEvent {
  eventType: string;
  severity: Severity;
  endpoint?: string;
  method?: string;
  details?: Record<string, unknown>;
  userId?: string;
}

/**
 * Log a security event to Supabase.
 * Uses the anon key (RLS will only allow inserts, not reads).
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  if (!hasSupabase || !supabase) return;

  try {
    // Get client IP from a public API (best effort)
    let ipAddress: string | null = null;
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      ipAddress = data.ip;
    } catch {
      // IP detection is best-effort
    }

    await supabase.from('security_logs').insert({
      event_type: event.eventType,
      severity: event.severity,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      endpoint: event.endpoint,
      method: event.method,
      details: event.details,
      user_id: event.userId,
    });
  } catch {
    // Security logging should never break the app
  }
}

/**
 * Log a failed login attempt.
 */
export async function logFailedLogin(identifier: string, reason: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'failed_login',
    severity: 'warning',
    details: { identifier, reason },
  });
}

/**
 * Log a successful login.
 */
export async function logSuccessfulLogin(userId: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'login',
    severity: 'info',
    userId,
  });
}

/**
 * Log a suspicious input attempt (XSS, injection, etc.).
 */
export async function logSuspiciousInput(endpoint: string, input: string, pattern: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'suspicious_input',
    severity: 'critical',
    endpoint,
    details: { input: input.slice(0, 200), pattern },
  });
}

/**
 * Log a rate limit hit.
 */
export async function logRateLimit(endpoint: string): Promise<void> {
  await logSecurityEvent({
    eventType: 'rate_limit',
    severity: 'warning',
    endpoint,
  });
}
