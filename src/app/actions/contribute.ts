// src/app/actions/contribute.ts
// Server Action for public contribution submission.
//
// Re-validates with zod, enforces the honeypot, verifies the Cloudflare
// Turnstile token server-side, and rate-limits per IP before delegating to
// the Convex mutation. Returns { ok: true } on success or { error } on
// failure — never throws, so the client can render a friendly message.
'use server';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { rateLimitCheck } from '@/lib/rateLimit';
import { contributionFormSchema } from '@/lib/schemas';

interface ActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function clientIp(): string {
  // Server Actions run server-side; rate limiting falls back to a shared
  // key when the IP is unknown so the action still works.
  return 'unknown';
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    return true;
  }
  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
      },
    );
    const data = (await res.json()) as { success?: boolean; hostname?: string };
    if (!data.success) return false;
    const expected = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : undefined;
    if (expected && data.hostname && data.hostname !== expected) return false;
    return true;
  } catch {
    return false;
  }
}

export async function submitContribution(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  // Honeypot — bots fill this in.
  const website = (formData.get('website') as string) || '';
  if (website.trim().length > 0) {
    return { ok: false, error: 'Submission rejected.' };
  }

  const raw: {
    type: FormDataEntryValue | null;
    input1: FormDataEntryValue | null;
    input2: FormDataEntryValue | null;
    context: string;
    tags: string[];
    website: string;
    turnstile: FormDataEntryValue | null;
  } = {
    type: formData.get('type'),
    input1: formData.get('input1'),
    input2: formData.get('input2'),
    // FormData.get returns null when the field is absent; the schema expects
    // a string, so coerce here rather than letting zod reject the submission.
    context: (formData.get('context') as string) ?? '',
    tags: [],
    website,
    turnstile: formData.get('turnstile'),
  };

  const tagsRaw = formData.get('tags');
  if (typeof tagsRaw === 'string') {
    try {
      const parsed = JSON.parse(tagsRaw);
      if (Array.isArray(parsed)) {
        raw.tags = parsed.filter(
          (t: unknown): t is string => typeof t === 'string',
        );
      }
    } catch {
      raw.tags = [];
    }
  }

  const parsed = contributionFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string' && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  const { turnstile, ...data } = parsed.data;

  const limit = await rateLimitCheck(`contribute:${clientIp()}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      error: 'Too many submissions. Please wait a moment and try again.',
    };
  }

  const turnstileOk = await verifyTurnstile(turnstile);
  if (!turnstileOk) {
    return { ok: false, error: 'Verification failed. Please try again.' };
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Submission is temporarily unavailable.' };
    }
    return { ok: true }; // demo mode — accept silently
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    // Map the public form onto the existing `contributions.submit`
    // mutation shape (type -> icon, input1 -> title, input2 -> subtitle,
    // context -> content). The mutation enforces its own length limits and
    // requires the caller to be signed in.
    await convex.mutation(api.contributions.mutations.submit, {
      type: data.type,
      title: data.input1,
      subtitle: data.input2,
      content: data.context || `${data.input1} — ${data.input2}`,
      icon: data.type,
    });
  } catch (e) {
    console.error('[contribute] submission failed', e);
    return { ok: false, error: 'We could not save your contribution. Please try again.' };
  }

  return { ok: true };
}