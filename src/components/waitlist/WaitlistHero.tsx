'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Check, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { getVisitorId } from '@/lib/visitorId';

const hasBackend = !!process.env.NEXT_PUBLIC_CONVEX_URL;

function useAnimatedNumber(target: number | null): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      frameRef.current = requestAnimationFrame(() => {
        fromRef.current = target;
        setValue(target);
      });
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      };
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const duration = 700;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + delta * eased;
      fromRef.current = current;
      setValue(current);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  return value;
}

function WaitlistCounter({ count }: { count: number | null }) {
  const animated = useAnimatedNumber(count);
  const [flash, setFlash] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (count === null) return;
    if (prevCountRef.current === count) return;
    prevCountRef.current = count;
    const onId = window.setTimeout(() => setFlash(true), 30);
    const offId = window.setTimeout(() => setFlash(false), 750);
    return () => {
      window.clearTimeout(onId);
      window.clearTimeout(offId);
    };
  }, [count]);

  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
      <span
        className={`font-display text-5xl font-extrabold tabular-nums tracking-tight transition-colors duration-500 sm:text-6xl ${
          flash ? 'text-primary' : 'text-foreground'
        }`}
      >
        {count === null ? '…' : Math.round(animated).toLocaleString('en-US')}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm">
        people waiting
      </span>
    </div>
  );
}

interface WaitlistBlockProps {
  count: number | null;
  joined: boolean;
  position: number | null;
  pending: boolean;
  errorMessage: string | null;
  onJoin: () => void;
}

function WaitlistBlock({
  count,
  joined,
  position,
  pending,
  errorMessage,
  onJoin,
}: WaitlistBlockProps) {
  return (
    <section
      aria-label="Waitlist"
      className="mt-4 flex animate-fade-in-up flex-col items-center gap-6"
    >
      <WaitlistCounter count={count} />

      {joined ? (
        <div
          role="status"
          className="inline-flex flex-wrap items-center justify-center gap-2.5 rounded-xl border border-success/60 bg-success/10 px-6 py-3.5 text-base font-semibold text-foreground"
        >
          <Check className="size-5 text-success" strokeWidth={3} aria-hidden="true" />
          You&rsquo;re on the list
          {position !== null && (
            <span className="font-medium text-muted-foreground">
              · #{position.toLocaleString('en-US')}
            </span>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
              Joining&hellip;
            </>
          ) : (
            'Join the waitlist'
          )}
        </button>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="max-w-md rounded-xl border border-destructive/50 bg-destructive/10 px-5 py-3 text-sm font-medium text-destructive"
        >
          {errorMessage}
        </div>
      )}
    </section>
  );
}

function LiveWaitlist() {
  const [visitorId] = useState<string | null>(() => getVisitorId());
  const countData = useQuery(api.waitlist.queries.getCount);
  const status = useQuery(api.waitlist.queries.getStatus, visitorId ? { visitorId } : 'skip');
  const join = useMutation(api.waitlist.mutations.join);

  const [pending, setPending] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [localPosition, setLocalPosition] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const joined = hasJoined || status?.joined === true;
  const position = localPosition ?? status?.position ?? null;
  const count = countData?.count ?? null;

  useEffect(() => {
    if (!errorMessage) return;
    const id = window.setTimeout(() => setErrorMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [errorMessage]);

  const handleJoin = async () => {
    if (pending || joined) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const result = await join({ visitorId: visitorId ?? undefined });
      if (result) {
        setHasJoined(true);
        setLocalPosition(result.position ?? null);
      }
    } catch (error) {
      console.error('Waitlist join failed:', error);
      setErrorMessage('Couldn\u2019t join the waitlist. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <WaitlistBlock
      count={count}
      joined={joined}
      position={position}
      pending={pending}
      errorMessage={errorMessage}
      onJoin={handleJoin}
    />
  );
}

function DemoWaitlist() {
  return (
    <p role="status" className="mx-auto mt-6 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
      Waitlist registration is unavailable in this preview. No registration has been submitted. You can still explore Samiati and try the chat interface.
    </p>
  );
}

export default function WaitlistHero() {
  if (!hasBackend) return <DemoWaitlist />;
  return <LiveWaitlist />;
}
