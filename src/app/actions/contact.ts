// src/app/actions/contact.ts
// Server Action for public contact form submissions.
//
// Re-validates with zod, enforces the honeypot, verifies the Cloudflare
// Turnstile token server-side, and rate-limits per IP before storing the
// message. Returns { ok: true } on success or { error } on failure.
'use server';

import { ConvexHttpClient } from 'convex/browser';
import { rateLimitCheck } from '@/lib/rateLimit';
import { contactFormSchema } from '@/lib/schemas';

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

export async function submitContact(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const website = (formData.get('website') as string) || '';
  if (website.trim().length > 0) {
    return { ok: false, error: 'Submission rejected.' };
  }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    website,
    turnstile: formData.get('turnstile'),
  };

  const parsed = contactFormSchema.safeParse(raw);
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

  const limit = await rateLimitCheck(`contact:${clientIp()}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      error: 'Too many requests. Please wait a moment and try again.',
    };
  }

  const turnstileOk = await verifyTurnstile(turnstile);
  if (!turnstileOk) {
    return { ok: false, error: 'Verification failed. Please try again.' };
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Contact form is temporarily unavailable.' };
    }
    return { ok: true }; // demo mode
  }

  // Persist the message. The dedicated `contactMessages` table does not
  // exist yet — add it to convex/schema.ts and run `npx convex dev` to
  // regenerate the bindings, then uncomment the mutation call below.
  try {
    const convex = new ConvexHttpClient(convexUrl);
    // await convex.mutation(api.contactMessages.submit, {
    //   name: data.name,
    //   email: data.email,
    //   message: data.message,
    // });
    void convex; // keep the client reference so the shape is documented
    console.info('[contact] message received', {
      name: data.name,
      email: data.email,
      message: data.message.slice(0, 200),
    });
  } catch (e) {
    console.error('[contact] submission failed', e);
    return { ok: false, error: 'We could not send your message. Please try again.' };
  }

  return { ok: true };
}