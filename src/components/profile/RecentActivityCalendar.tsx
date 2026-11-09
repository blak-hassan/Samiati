'use client';

import type { ProfileDashboard } from '@/types';

export function RecentActivityCalendar({ timeline }: { timeline: ProfileDashboard['timeline'] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 27 + index);
    return date;
  });
  const counts = new Map<string, number>();
  for (const event of timeline) {
    const date = new Date(event.timestamp).toDateString();
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">Recent contribution activity</h3>
        <span className="text-xs text-muted-foreground">Last 28 days</span>
      </div>
      <table
        className="mt-5 w-full table-fixed border-separate border-spacing-1.5"
        aria-label="Recent contribution activity calendar"
      >
        <tbody>
          {Array.from({ length: 4 }, (_, week) => (
            <tr key={week}>
              {dates.slice(week * 7, week * 7 + 7).map((date) => {
                const count = counts.get(date.toDateString()) ?? 0;
                return (
                  <td
                    key={date.toISOString()}
                    className={`h-9 rounded-lg border border-border text-center text-xs ${count > 0 ? 'bg-ai/20 font-semibold text-ai' : 'bg-secondary/40 text-muted-foreground'}`}
                    title={`${date.toLocaleDateString()}: ${count} returned activity events`}
                  >
                    <span aria-hidden="true">
                      {date.getDate()}
                      {count > 0 && <span className="ml-0.5">·</span>}
                    </span>
                    <span className="sr-only">
                      {date.toLocaleDateString()}: {count} recent activity events
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Highlighted dates contain events from your recent Changa timeline. This sample is limited to
        the latest returned activity and is not a complete history.
      </p>
    </section>
  );
}
