// tests/forms/contribution.test.ts
// Unit tests for the public contribution form schema and the submitContribution
// server action's client-side validation path.
//
// The full server action (Convex mutation, Turnstile verification, rate limit)
// requires a running backend and is covered by e2e/journey.spec.ts. These
// tests assert the schema invariants that run in the browser before any
// network call.
import { describe, it, expect } from 'vitest';
import { contributionFormSchema, contactFormSchema } from '../../src/lib/schemas';

describe('contributionFormSchema', () => {
  const base = {
    type: 'word',
    input1: 'samiati',
    input2: 'سمياطي',
    context: 'A greeting',
    tags: ['swahili'],
    website: '',
    turnstile: 'token',
  };

  it('accepts a valid submission', () => {
    const r = contributionFormSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('rejects an empty type', () => {
    const r = contributionFormSchema.safeParse({ ...base, type: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path[0]).toBe('type');
  });

  it('rejects short input1', () => {
    const r = contributionFormSchema.safeParse({ ...base, input1: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path[0]).toBe('input1');
  });

  it('rejects a missing turnstile token', () => {
    const r = contributionFormSchema.safeParse({ ...base, turnstile: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path[0]).toBe('turnstile');
  });

  it('rejects when the honeypot is filled (bot)', () => {
    const r = contributionFormSchema.safeParse({ ...base, website: 'http://evil' });
    expect(r.success).toBe(false);
  });

  it('enforces input length caps', () => {
    const r = contributionFormSchema.safeParse({
      ...base,
      input1: 'x'.repeat(5001),
    });
    expect(r.success).toBe(false);
  });

  it('accepts empty tags', () => {
    const r = contributionFormSchema.safeParse({ ...base, tags: [] });
    expect(r.success).toBe(true);
  });
});

describe('contactFormSchema', () => {
  const base = {
    name: 'Sam',
    email: 'sam@example.com',
    message: 'Hello there, this is a message',
    website: '',
    turnstile: 'token',
  };

  it('accepts a valid submission', () => {
    expect(contactFormSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const r = contactFormSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path[0]).toBe('email');
  });

  it('rejects a too-short message', () => {
    const r = contactFormSchema.safeParse({ ...base, message: 'short' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path[0]).toBe('message');
  });

  it('rejects when the honeypot is filled', () => {
    const r = contactFormSchema.safeParse({ ...base, website: 'spam' });
    expect(r.success).toBe(false);
  });
});