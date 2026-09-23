/**
 * Privacy-conscious analytics event tracking for Samiati.
 *
 * IMPORTANT CONSTRAINTS (from implementation plan §10):
 * - Do NOT send actual private conversation content to analytics
 * - Only track behavioral events, never message content
 * - Use for product/funnel analytics, not surveillance
 *
 * Events tracked:
 * - language_selected
 * - translation_started / completed / failed
 * - voice_started / completed
 * - changa_opened / started / submitted
 * - feedback_given
 * - discover_opened
 * - signup_completed
 * - subscription_started / completed
 */

export type AnalyticsEvent =
  | 'language_selected'
  | 'translation_started'
  | 'translation_completed'
  | 'translation_failed'
  | 'voice_started'
  | 'voice_completed'
  | 'changa_opened'
  | 'changa_started'
  | 'changa_submitted'
  | 'feedback_given'
  | 'discover_opened'
  | 'signup_completed'
  | 'subscription_started'
  | 'subscription_completed';

/**
 * Properties that can be attached to any event.
 * Keep this minimal and privacy-safe — no PII, no conversation content.
 */
export type AnalyticsEventProperties = {
  // Language codes (ISO 639-3 or common codes like 'sw', 'ki', 'luo')
  languageCode?: string;
  // AI service type (chat, translate, tts, asr)
  service?: 'chat' | 'translate' | 'tts' | 'asr' | 'search';
  // Result status
  status?: 'success' | 'error' | 'cancelled';
  // Error type if status is 'error' — generic category only, no details
  errorType?: 'timeout' | 'rate_limit' | 'provider_error' | 'quota_exceeded' | 'network' | 'unknown';
  // Plan tier at time of event
  planTier?: 'free' | 'learner' | 'fluent' | 'organization';
  // Screen/section where event occurred (for funnel analysis)
  location?: string;
  // Duration in ms for completed actions (rounded to nearest second)
  durationMs?: number;
  // Whether user is authenticated (without identifying who)
  isAuthenticated?: boolean;
  // Funnel analysis fields (added automatically by trackFunnelStep)
  funnel?: string;
  step?: number;
};

/**
 * Track an analytics event.
 *
 * This is a no-op in test environments and logs to console in development.
 * In production, this can be connected to:
 * - Vercel Analytics (already in package.json as @vercel/analytics)
 * - Sentry custom events
 * - A custom analytics endpoint
 *
 * The implementation deliberately does NOT include any automatic pageview
 * tracking or session replay — we control exactly what is tracked.
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  properties?: AnalyticsEventProperties,
): void {
  // Skip in test environments
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const payload = {
    event: eventName,
    timestamp: Date.now(),
    ...properties,
  };

  // Development: log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', payload);
    return;
  }

  // Production: could integrate with Vercel Analytics, Sentry, or custom endpoint
  // For now, this is a hook for future integration.
  // Example Vercel Analytics integration:
  // import { track } from '@vercel/analytics/react';
  // track(eventName, properties);

  // Example Sentry integration:
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureMessage(JSON.stringify(payload), { level: 'info' });

  // Placeholder: log to ensure the function exists but does nothing harmful
  // Remove or replace this in production when analytics provider is configured
  if (process.env.ANALYTICS_ENABLED === 'true') {
    // Future: send to analytics endpoint
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(payload) });
  }
}

/**
 * Track a sequence of related events as a funnel step.
 * Useful for tracking conversion funnels without sending excessive events.
 */
export function trackFunnelStep(
  funnelName: string,
  step: number,
  eventName: AnalyticsEvent,
  properties?: AnalyticsEventProperties,
): void {
  trackEvent(eventName, {
    ...properties,
    funnel: funnelName,
    step,
  });
}

/**
 * Safely sanitize properties before sending to analytics.
 * This is a safeguard to ensure no accidental PII leakage.
 */
export function sanitizeEventProperties(
  props: AnalyticsEventProperties,
): AnalyticsEventProperties {
  // Remove any properties that might contain PII
  const sanitized = { ...props };

  // Explicitly undefined any potentially sensitive fields
  // (This is defensive — the types above should prevent this, but defense in depth)
  delete (sanitized as Record<string, unknown>).userId;
  delete (sanitized as Record<string, unknown>).email;
  delete (sanitized as Record<string, unknown>).name;
  delete (sanitized as Record<string, unknown>).phone;
  delete (sanitized as Record<string, unknown>).message;
  delete (sanitized as Record<string, unknown>).text;
  delete (sanitized as Record<string, unknown>).content;

  return sanitized;
}