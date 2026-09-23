import { describe, it, expect, vi, beforeEach } from 'vitest';

// Schema-only tests. The repo's vitest setup does not install
// @testing-library/react, so we assert the zod contract and the Server
// Action's field-error contract directly instead of rendering the form.

// The Server Action imports Convex + rateLimit, both of which need a real
// deployment or a mock. Mock them so the action runs in pure logic.
vi.mock('@/lib/rateLimit', () => ({
  rateLimitCheck: vi.fn(async () => ({ allowed: true, remaining: 9, retryAfterMs: 0 })),
}));
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    mutation = vi.fn(async () => ({}));
  },
}));

const {
  contributionFormSchema,
  contactFormSchema,
  resetPasswordSchema,
  contributionSchema,
} = await import('../../src/lib/schemas');

const { submitContribution } = await import('../../src/app/actions/contribute');

describe('contributionFormSchema', () => {
  const base = {
    type: 'word',
    input1: 'umwe',
    input2: 'tomorrow',
    context: '',
    tags: ['swahili'],
    website: '',
    turnstile: 'token',
  };

  it('accepts valid data', () => {
    expect(contributionFormSchema.safeParse(base).success).toBe(true);
  });

  it('requires a contribution type', () => {
    const r = contributionFormSchema.safeParse({ ...base, type: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].message).toBe('Type is required');
  });

  it('requires content and translation', () => {
    const r1 = contributionFormSchema.safeParse({ ...base, input1: '' });
    const r2 = contributionFormSchema.safeParse({ ...base, input2: '' });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it('bounds content length', () => {
    const r = contributionFormSchema.safeParse({ ...base, input1: 'x'.repeat(5001) });
    expect(r.success).toBe(false);
  });

  it('rejects a filled honeypot (website)', () => {
    const r = contributionFormSchema.safeParse({ ...base, website: 'https://spam.example' });
    expect(r.success).toBe(false);
    expect(r.error.issues.some((i) => i.message === 'Submission rejected')).toBe(true);
  });

  it('requires a Turnstile token', () => {
    const r = contributionFormSchema.safeParse({ ...base, turnstile: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues.some((i) => i.message === 'Please complete the verification')).toBe(true);
  });
});

describe('contactFormSchema', () => {
  const base = { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Hello there', website: '', turnstile: 'token' };

  it('accepts valid data', () => {
    expect(contactFormSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(contactFormSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a short message', () => {
    expect(contactFormSchema.safeParse({ ...base, message: 'hi' }).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    expect(contactFormSchema.safeParse({ ...base, website: 'spam' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('requires a non-empty code', () => {
    expect(resetPasswordSchema.safeParse({ code: '', newPassword: 'supersecret' }).success).toBe(false);
  });

  it('requires an 8+ char password', () => {
    expect(resetPasswordSchema.safeParse({ code: '123456', newPassword: 'short' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ code: '123456', newPassword: 'supersecret' }).success).toBe(true);
  });
});

describe('contributionSchema (server-side)', () => {
  it('does not include honeypot or turnstile fields', () => {
    // The server-side schema must be stricter than the public form schema:
    // no website/turnstile fields that the client could tamper with.
    const keys = Object.keys(contributionSchema.shape);
    expect(keys).not.toContain('website');
    expect(keys).not.toContain('turnstile');
    expect(keys).toEqual(['type', 'input1', 'input2', 'context', 'tags']);
  });
});

describe('submitContribution Server Action contract', () => {
  it('returns fieldErrors when Turnstile is missing', async () => {
    const fd = new FormData();
    fd.set('type', 'word');
    fd.set('input1', 'umwe');
    fd.set('input2', 'tomorrow');
    fd.set('context', 'greeting');
    fd.set('tags', '[]');
    fd.set('website', '');
    fd.set('turnstile', ''); // empty — zod rejects it as a field error

    const res = await submitContribution(undefined, fd);
    expect(res.ok).toBe(false);
    expect(res.fieldErrors).toBeDefined();
    expect(res.fieldErrors.turnstile).toBe('Please complete the verification');
  });

  it('submits successfully with valid data and a Turnstile token', async () => {
    // No TURNSTILE_SECRET_KEY + non-production env => verifyTurnstile passes.
    delete process.env.TURNSTILE_SECRET_KEY;
    process.env.NODE_ENV = 'test';
    delete process.env.NEXT_PUBLIC_CONVEX_URL;

    const fd = new FormData();
    fd.set('type', 'word');
    fd.set('input1', 'umwe');
    fd.set('input2', 'tomorrow');
    fd.set('context', 'greeting');
    fd.set('tags', JSON.stringify(['swahili']));
    fd.set('website', '');
    fd.set('turnstile', 'test-token');

    const res = await submitContribution(undefined, fd);
    if (!res.ok) {
      // Surface the real reason so the test failure is actionable.
      console.error('submitContribution failed:', JSON.stringify(res));
    }
    expect(res.ok).toBe(true);
  });

  it('returns fieldErrors keyed by field name', async () => {
    const fd = new FormData();
    fd.set('type', '');
    fd.set('input1', '');
    fd.set('input2', '');
    fd.set('tags', '[]');
    fd.set('website', '');
    fd.set('turnstile', 'token');

    const res = await submitContribution(undefined, fd);
    expect(res.ok).toBe(false);
    expect(res.fieldErrors).toBeDefined();
    expect(res.fieldErrors.type).toBeTruthy();
    expect(res.fieldErrors.input1).toBeTruthy();
    expect(res.fieldErrors.input2).toBeTruthy();
  });
});