// src/components/WaitlistForm.tsx
// Public waitlist signup with a live subscriber counter and a one-click path
// for visitors who are already signed in.
//
// Two join paths, chosen by auth state:
//   - Signed out: the name/email form. The email is the only way to reach an
//     anonymous visitor.
//   - Signed in: a single "Join Waitlist" button. Asking somebody who has
//     already authenticated for their email again is friction with no upside —
//     the backend reads it from their `users` document and links the row to
//     their account id (convex/waitlist/mutations.ts `joinAuthenticated`).
//     Guests who already entered their email anonymously get that same row
//     backfilled with their userId rather than a duplicate entry.
//
// Real-time: `useQuery(api.waitlist.queries.getCount)` subscribes to the
// waitlist counter over Convex's WebSocket transport. When any other visitor
// joins, every browser rendering this component re-renders with the new count —
// no manual refresh required.
//
// Spam protection: a honeypot field catches basic bots, and the server-side
// `subscribe` mutation enforces email uniqueness + a per-email sliding-window
// rate limit (convex/lib/rateLimit.ts).

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, CheckCircle2, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppUser } from '@/hooks/useAppUser';

interface WaitlistFormProps {
  /** Where this form appears — used as the `source` field for analytics. */
  source?: string;
  /** Optional heading override. */
  title?: string;
  /** Optional subheading override. */
  description?: string;
  /**
   * Confirmation shown after a successful submit.
   *
   * Default wording is deliberately launch-agnostic. It previously read
   * "We'll notify you as soon as we launch", which contradicted the rest of
   * the landing page (live pricing, sign-up, checkout) and split the funnel
   * between "sign up now" and "wait for launch".
   */
  successMessage?: string;
}

/**
 * Shared submit button for both join paths so the pending / joined states and
 * their accessible labels are identical whether the caller supplied an email
 * or an account.
 */
function JoinButton({
  isPending,
  isJoined,
  type,
  onClick,
}: {
  isPending: boolean;
  isJoined: boolean;
  type: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <Button type={type} size="lg" className="w-full" onClick={onClick} disabled={isPending || isJoined}>
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Joining…
        </>
      ) : isJoined ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Joined
        </>
      ) : (
        'Join Waitlist'
      )}
    </Button>
  );
}

export function WaitlistForm({
  source = 'landing',
  title = 'Stay in the loop',
  description = 'Occasional email updates on new languages and features.',
  successMessage = "You're subscribed! We'll keep you posted.",
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const subscribe = useMutation(api.waitlist.mutations.subscribe);
  const joinWithAccount = useMutation(api.waitlist.mutations.joinAuthenticated);
  // Reactive count — updates automatically when new subscribers join.
  const count = useQuery(api.waitlist.queries.getCount) ?? 0;
  // Authoritative "have I already joined?" for the signed-in one-click path.
  // Undefined while loading, so we treat it as "not yet" — the mutation itself
  // is idempotent server-side, so a stale false is harmless.
  const myStatus = useQuery(api.waitlist.queries.getMyStatus);

  // `isLoaded` gates the branch: before Clerk resolves, every signed-in user
  // would briefly see the guest email form and could submit it. Rendering
  // nothing until auth settles avoids that flash.
  const { user, isLoaded, isSignedIn } = useAppUser();
  const isJoined = success || myStatus?.isSubscribed === true;

  async function onJoinWithAccount() {
    setError(null);
    setIsPending(true);
    try {
      // No email is sent: the server resolves the caller from the auth token.
      await joinWithAccount({ source });
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
        <p className="text-xs text-gold font-medium" data-testid="waitlist-count">
          {count > 0
            ? `${count.toLocaleString()} ${count === 1 ? 'person' : 'people'} already joined`
            : 'Be the first to join'}
        </p>
      </div>

      {!isLoaded ? null : isSignedIn ? (
        /* Signed-in path: one button, no email or password fields. The email
           comes from the authenticated `users` document, so nothing
           identifying is sent by the client. */
        <div className="space-y-3">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
            <UserCheck className="h-4 w-4 text-gold" aria-hidden="true" />
            {user?.name ? `Joining as ${user.name}` : 'Joining with your account'}
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          {isJoined && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg bg-success/10 p-3 text-sm text-success flex items-start gap-2"
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <JoinButton
            type="button"
            isPending={isPending}
            isJoined={isJoined}
            onClick={onJoinWithAccount}
          />
        </div>
      ) : (
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
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <JoinButton type="submit" isPending={isPending} isJoined={success} />
        </form>
      )}
    </div>
  );
}