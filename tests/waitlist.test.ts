// tests/waitlist.test.ts
// Unit tests for the waitlist subscribe mutation logic.
//
// The handler is exercised through a mock MutationCtx so we can assert the
// three security invariants without a live Convex backend:
//   1. Duplicate emails are rejected (idempotent ok=true, alreadySubscribed).
//   2. Rate-limit exhaustion throws.
//   3. A valid first submission inserts a row and returns ok=true.
//
// The real-time counter behaviour is covered by e2e/journey.spec.ts.

import { describe, it, expect } from 'vitest';
import { subscribeHandler } from '../convex/waitlist/mutations';
import type { MutationCtx } from '../convex/_generated/server';

// Minimal mock of MutationCtx["db"] scoped per table. It supports the
// `.query(table).withIndex(name, builderCb)` + `.first()` surface used by
// `subscribeHandler` and `checkRateLimit`, plus `insert`, `patch`, and
// `delete`.
function makeDb(
  seed: Array<{ table: string; doc: Record<string, unknown> }> = [],
) {
  // docs[table] = Map<id, doc>
  const tables = new Map<string, Map<string, Record<string, unknown>>>();
  let seq = 0;

  function tableMap(name: string) {
    let m = tables.get(name);
    if (!m) {
      m = new Map();
      tables.set(name, m);
    }
    return m;
  }

  for (const { table, doc } of seed) {
    const id = `doc_${seq++}`;
    tableMap(table).set(id, { ...doc, _id: id });
  }

  function runQuery(
    table: string,
    builderCb: (b: { eq: (f: string, v: unknown) => void }) => void,
  ) {
    const conditions: Array<{ field: string; value: unknown }> = [];
    const fakeBuilder = {
      eq: (field: string, value: unknown) => {
        conditions.push({ field, value });
        return fakeBuilder;
      },
    };
    builderCb(fakeBuilder);

    const matches = [...tableMap(table).values()].filter((d) =>
      conditions.every((c) => d[c.field] === c.value),
    );

    return {
      first() {
        return matches[0] ?? null;
      },
      collect() {
        return matches;
      },
    };
  }

  return {
    query(table: string) {
      return {
        withIndex(
          _name: string,
          builderCb: (b: { eq: (f: string, v: unknown) => void }) => void,
        ) {
          return runQuery(table, builderCb);
        },
      };
    },
    insert(table: string, doc: Record<string, unknown>) {
      const id = `doc_${seq++}`;
      tableMap(table).set(id, { ...doc, _id: id });
      return id;
    },
    patch(id: string, patch: Record<string, unknown>) {
      for (const m of tables.values()) {
        const existing = m.get(id);
        if (existing) {
          Object.assign(existing, patch);
          return 1;
        }
      }
      return 0;
    },
    delete(id: string) {
      for (const m of tables.values()) {
        if (m.has(id)) {
          m.delete(id);
          return 1;
        }
      }
      return 0;
    },
    // Expose for assertions.
    _tables: tables,
  };
}

function makeCtx(
  seed: Array<{ table: string; doc: Record<string, unknown> }> = [],
) {
  const db = makeDb(seed);
  return {
    db,
    runMutation: async () => undefined,
  } as unknown as MutationCtx;
}

describe('waitlist subscribe', () => {
  it('inserts a new subscriber on first submission', async () => {
    const ctx = makeCtx();
    const res = await subscribeHandler(ctx, {
      email: 'a@example.com',
      name: 'Ada',
      source: 'landing',
    });
    expect(res.ok).toBe(true);
    expect(res.alreadySubscribed).toBe(false);
    // The mock db stored the row — read it back through the same store.
    const db = ctx.db as unknown as { _tables: Map<string, Map<string, Record<string, unknown>>> };
    const stored = [...db._tables.get('waitlist')!.values()].find(
      (d) => d.email === 'a@example.com',
    );
    expect(stored).toBeTruthy();
    expect(stored?.isNotified).toBe(false);
  });

  it('is idempotent for duplicate emails', async () => {
    const ctx = makeCtx([{ table: 'waitlist', doc: { email: 'a@example.com' } }]);
    const res = await subscribeHandler(ctx, { email: 'a@example.com' });
    expect(res.ok).toBe(true);
    expect(res.alreadySubscribed).toBe(true);
  });

  it('normalises email case before dedup', async () => {
    const ctx = makeCtx([{ table: 'waitlist', doc: { email: 'a@example.com' } }]);
    const res = await subscribeHandler(ctx, { email: 'A@Example.com' });
    expect(res.alreadySubscribed).toBe(true);
  });

  it('throws when rate limit exceeded', async () => {
    // Pre-seed the rateLimits table with 5 counters for this email key,
    // all within the sliding window — checkRateLimit will see count=5
    // against maxRequests=5 and reject.
    const seed = Array.from({ length: 5 }, () => ({
      table: 'rateLimits',
      doc: {
        key: 'waitlist:a@example.com',
        windowStart: Date.now(),
        count: 1,
        updatedAt: Date.now(),
      },
    }));
    const ctx = makeCtx(seed);
    await expect(subscribeHandler(ctx, { email: 'a@example.com' })).rejects.toThrow(
      /Too many submissions/,
    );
  });
});