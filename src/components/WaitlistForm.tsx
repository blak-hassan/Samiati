// src/components/WaitlistForm.tsx
// Public waitlist signup form with a live subscriber counter.
//
// Real-time: `useQuery(api.waitlist.getCount)` subscribes to the waitlist
// table over Convex's WebSocket transport. When any other visitor submits
// their email, every browser rendering this component re-renders with the
// new count — no manual refresh required.
//
// Spam protection: a honeypot field catches basic bots, and the server-side
// `subscribe` mutation enforces email uniqueness + a per-email sliding-window
// rate limit (convex/lib/rateLimit.ts).

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WaitlistFormProps {
  /** Where this form appears — used as the `source` field for analytics. */
  source?: string;
  /** Optional heading override. */
  title?: string;
  /** Optional subheading override. */
  description?: string;
}

export function WaitlistForm({
  source = 'landing',
  title = 'Join the waitlist',
  description = 'Be the first to know when we launch.',
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const subscribe = useMutation(api.waitlist.mutations.subscribe);
  // Reactive count — updates automatically when new subscribers join.
  const count = useQuery(api.waitlist.queries.getCount) ?? 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Honeypot: bots fill hidden fields; real users never touch this.
    if (website.trim().length > 0) {
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsPending(true);
    try {
      await subscribe({
        email: email.trim(),
        name: name.trim() || undefined,
        source,
      });
      setEmail('');
      setName('');
      setSuccess(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-2 text-center sm:text-left">
        <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
          <Users className="h-5 w-5 text-gold" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-gold font-medium">
          {count > 0
            ? `${count.toLocaleString()} ${count === 1 ? 'person' : 'people'} already joined`
            : 'Be the first to join'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        {/* Honeypot — visually hidden; bots fill it, real users don't. */}
        <div className="sr-only" aria-hidden="true">
          <Label htmlFor="waitlist-website">Website</Label>
          <Input
            id="waitlist-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="waitlist-name">Name (optional)</Label>
          <Input
            id="waitlist-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending || success}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="waitlist-email">Email</Label>
          <Input
            id="waitlist-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending || success}
            required
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg bg-success/10 p-3 text-sm text-success flex items-start gap-2"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>You&apos;re on the list! We&apos;ll notify you as soon as we launch.</span>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isPending || success}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Joining…
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Joined
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </form>
    </div>
  );
}