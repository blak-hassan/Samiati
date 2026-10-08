'use client';

import { useState } from 'react';
import { LANGUAGES } from '@/lib/languages';
import { cn } from '@/lib/utils';

/**
 * "Language strength" interactive preview (`Language strength` section).
 *
 * Design spec:
 *   - "How well does AI know your language today?"
 *   - "Tap a point. Add a contribution. Watch it grow."
 *   - "Overall strength 0 / 100" (grows with each contribution)
 *   - "Illustrative preview scores. Real scores will come from Changa
 *      measurements."
 *
 * The per-language scores are the illustrative values already published on the
 * in-app language table (`LANGUAGES`), minus English — this section is about
 * African languages. Contributions are a local preview only: nothing is
 * persisted, and the caption says so, matching the design's disclaimer.
 *
 * Each language row is a full-width button (≥44px tap target, keyboard
 * focusable) so the chart works with touch and screen readers — a bare SVG
 * point would not.
 */

export interface StrengthLanguage {
  code: string;
  name: string;
  score: number;
}

/** Illustrative preview data — in-app language table, English excluded. */
const PREVIEW_LANGUAGES: StrengthLanguage[] = LANGUAGES.filter(
  (l) => l.code !== 'en',
).map((l) => ({ code: l.code, name: l.name, score: l.score }));

export function LanguageStrength() {
  const [selected, setSelected] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(PREVIEW_LANGUAGES.map((l) => [l.code, l.score])),
  );
  const [contributions, setContributions] = useState(0);
  const [status, setStatus] = useState('');

  const selectedLang = PREVIEW_LANGUAGES.find((l) => l.code === selected);

  const contribute = () => {
    if (!selectedLang) return;
    const nextContributions = contributions + 1;
    const nextScore = Math.min(100, scores[selectedLang.code] + 1);
    setScores((prev) => ({ ...prev, [selectedLang.code]: nextScore }));
    setContributions(Math.min(100, nextContributions));
    setStatus(
      `Contributed to ${selectedLang.name}. Its preview score is now ${nextScore}. Overall strength ${Math.min(100, nextContributions)} of 100.`,
    );
  };

  const overall = contributions;


  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      {/* Overall strength meter */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Overall strength
          </p>
          <p className="text-4xl font-extrabold tracking-tight">
            {overall}
            <span className="text-lg font-semibold text-muted-foreground">
              {' '}
              / 100
            </span>
          </p>
        </div>
        <div className="min-w-48 flex-1">
          <div
            role="progressbar"
            aria-valuenow={overall}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall strength"
            className="h-3 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chart — one tappable row per language */}
      <ul className="space-y-2">
        {PREVIEW_LANGUAGES.map((lang) => {
          const score = scores[lang.code];
          const isSelected = selected === lang.code;
          return (
            <li key={lang.code}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelected(lang.code)}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-muted/60',
                )}
              >
                <span className="w-24 shrink-0 text-sm font-semibold">
                  {lang.name}
                </span>
                <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums">
                  {score}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Contribution controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={contribute}
          disabled={!selectedLang}
          className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selectedLang
            ? `Add a contribution to ${selectedLang.name}`
            : 'Tap a point to contribute'}
        </button>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {status ||
            'Tap a language above, add a contribution, and watch it grow.'}
        </p>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Illustrative preview scores. Real scores will come from Changa
        measurements.
      </p>
    </div>
  );
}
