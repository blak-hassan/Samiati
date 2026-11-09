import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegisteredMutation, RegisteredQuery } from 'convex/server';
import type { MutationCtx } from '../convex/_generated/server';
import type { Id } from '../convex/_generated/dataModel';
import {
  cancelSubscription,
  getActiveSubscription,
  getBillingHistory,
  recordDunningAttempt,
  recordRenewalAttempt,
  startSubscription,
} from '../convex/payments/billing';
import { checkUsageLimit, getUsageStats, recordUsage } from '../convex/payments/usage';
import { store } from '../convex/users/mutations';

const ownerId = 'owner' as Id<'users'>;
const otherId = 'other' as Id<'users'>;
const subscriptionId = 'subscription' as Id<'subscriptions'>;
const now = new Date(2026, 10, 9, 12).getTime();
const periodStart = new Date(2026, 10, 1).getTime();
const periodEnd = new Date(2026, 10, 30, 23, 59, 59, 999).getTime();

const owner = {
  _id: ownerId,
  clerkId: 'clerk_owner',
  name: 'Owner',
  handle: 'owner_handle',
  avatar: 'https://example.com/owner.png',
  email: 'owner@example.com',
  emailVerified: true,
  role: 'member',
  profileVisible: true,
  showChanga: true,
  voiceDataAllowed: false,
  culturalDataAllowed: false,
};
const other = {
  ...owner,
  _id: otherId,
  clerkId: 'clerk_other',
  handle: 'other_handle',
  // Elevated roles still cannot act on another account's billing.
  role: 'admin',
};
const subscription = {
  _id: subscriptionId,
  _creationTime: 2,
  userId: ownerId,
  plan: 'learner',
  status: 'active',
  currentPeriodStart: periodStart,
  currentPeriodEnd: periodEnd,
  paystackSubscriptionCode: 'private_subscription_code',
  paystackCustomerCode: 'private_customer_code',
  failedPaymentAttempts: 0,
};
const usage = {
  _id: 'usage',
  userId: ownerId,
  periodStart,
  periodEnd,
  chatMessages: 100,
  translateRequests: 50,
  voiceMessages: 25,
  voiceMinutes: 2.5,
};
const syncArgs = {
  name: owner.name,
  handle: owner.handle,
  avatar: owner.avatar,
};

type Row = { _id: string; [field: string]: unknown };
type Tables = Record<string, Row[]>;

// Convex exposes _handler at runtime but omits this internal property from its
// published declarations. Keep its argument and result types when unwrapping.
function getHandler<Args extends Record<string, unknown>, Result>(
  registered:
    | RegisteredQuery<'public' | 'internal', Args, Result>
    | RegisteredMutation<'public' | 'internal', Args, Result>
) {
  return (registered as unknown as { _handler: (ctx: MutationCtx, args: Args) => Result })._handler;
}

// Run the actual registered handlers and identity resolver with an in-memory
// context. Honor index predicates so a missing account/period filter fails.
function context(subject: string | null = owner.clerkId, overrides: Tables = {}) {
  const tables: Tables = {
    users: [{ ...owner }, { ...other }],
    subscriptions: [{ ...subscription }],
    billingEvents: [
      { _id: 'event', _creationTime: 1, userId: ownerId, paystackReference: 'private_reference' },
      { _id: 'foreign_event', _creationTime: 2, userId: otherId },
    ],
    usageTracking: [
      { ...usage },
      { ...usage, _id: 'old_usage', periodStart: 0, chatMessages: 999 },
      { ...usage, _id: 'foreign_usage', userId: otherId, chatMessages: 888 },
    ],
    ...overrides,
  };
  const indexReads: { table: string; index: string; predicates: [string, unknown][] }[] = [];
  const db = {
    query: vi.fn((table: string) => {
      let rows = [...(tables[table] ?? [])];
      const chain = {
        withIndex: (index: string, filter: (q: unknown) => unknown) => {
          const predicates: [string, unknown][] = [];
          const q = {
            eq: (field: string, value: unknown) => {
              predicates.push([field, value]);
              return q;
            },
          };
          filter(q);
          rows = rows.filter((row) => predicates.every(([field, value]) => row[field] === value));
          indexReads.push({ table, index, predicates });
          return chain;
        },
        order: (direction: 'asc' | 'desc') => {
          rows.sort(
            (a, b) =>
              (Number(a._creationTime ?? 0) - Number(b._creationTime ?? 0)) *
              (direction === 'asc' ? 1 : -1)
          );
          return chain;
        },
        first: async () => rows[0] ?? null,
        unique: async () => {
          if (rows.length > 1) throw new Error('Expected a unique row');
          return rows[0] ?? null;
        },
        take: async (count: number) => rows.slice(0, count),
      };
      return chain;
    }),
    get: vi.fn(
      async (id: string) =>
        Object.values(tables)
          .flat()
          .find((row) => row._id === id) ?? null
    ),
    patch: vi.fn(async (id: string, changes: Record<string, unknown>) => {
      const row = Object.values(tables)
        .flat()
        .find((entry) => entry._id === id);
      if (!row) throw new Error('Missing row');
      Object.assign(row, changes);
    }),
    insert: vi.fn(async (table: string, values: Record<string, unknown>) => {
      const id = `new_${table}`;
      (tables[table] ??= []).push({ _id: id, ...values });
      return id;
    }),
  };
  const auth = {
    getUserIdentity: vi.fn(async () =>
      subject === null
        ? null
        : {
            subject,
            email: owner.email,
            emailVerified: true,
          }
    ),
  };
  // Only the context services used by these handlers need fake implementations.
  return { ctx: { db, auth } as unknown as MutationCtx, db, auth, tables, indexReads };
}

function expectNoWrites(db: ReturnType<typeof context>['db']) {
  expect(db.patch).not.toHaveBeenCalled();
  expect(db.insert).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

const accountQueries = [
  {
    name: 'getActiveSubscription',
    run: (ctx: MutationCtx) => getHandler(getActiveSubscription)(ctx, { userId: ownerId }),
  },
  {
    name: 'getBillingHistory',
    run: (ctx: MutationCtx) => getHandler(getBillingHistory)(ctx, { userId: ownerId }),
  },
  {
    name: 'checkUsageLimit',
    run: (ctx: MutationCtx) =>
      getHandler(checkUsageLimit)(ctx, { userId: ownerId, service: 'chat', tier: 'learner' }),
  },
  {
    name: 'getUsageStats',
    run: (ctx: MutationCtx) => getHandler(getUsageStats)(ctx, { userId: ownerId, tier: 'learner' }),
  },
];
const rejectedCallers = [
  { name: 'anonymous caller', subject: null },
  { name: 'different account (even an admin)', subject: other.clerkId },
  { name: 'authenticated subject without a user record', subject: 'clerk_missing' },
  { name: 'subject matching a database ID instead of its Clerk ID', subject: ownerId },
];

describe.each(accountQueries)('$name owner boundary', ({ run }) => {
  it.each(rejectedCallers)('rejects $name before reading private records', async ({ subject }) => {
    const { ctx, db } = context(subject);
    await expect(run(ctx)).rejects.toThrow('Unauthorized');
    expect(db.query.mock.calls.every(([table]) => table === 'users')).toBe(true);
    expectNoWrites(db);
  });
});

describe('owner billing reads', () => {
  it("returns the owner's latest subscription and never another account's", async () => {
    const { ctx, db } = context(owner.clerkId, {
      subscriptions: [
        { ...subscription, _id: 'old', _creationTime: 1 },
        { ...subscription },
        { ...subscription, _id: 'foreign', userId: otherId, _creationTime: 3 },
      ],
    });
    expect(await getHandler(getActiveSubscription)(ctx, { userId: ownerId })).toEqual(subscription);
    expectNoWrites(db);
  });

  it("returns only the owner's most recent 50 billing events", async () => {
    const events = Array.from({ length: 55 }, (_, i) => ({
      _id: `event_${i}`,
      _creationTime: i,
      userId: ownerId,
    }));
    const { ctx, db } = context(owner.clerkId, {
      billingEvents: [...events, { _id: 'foreign', _creationTime: 100, userId: otherId }],
    });
    expect(await getHandler(getBillingHistory)(ctx, { userId: ownerId })).toEqual(
      events.slice(5).reverse()
    );
    expectNoWrites(db);
  });

  it('keeps empty owner billing reads valid', async () => {
    const { ctx, db } = context(owner.clerkId, { subscriptions: [], billingEvents: [] });
    expect(await getHandler(getActiveSubscription)(ctx, { userId: ownerId })).toBeNull();
    expect(await getHandler(getBillingHistory)(ctx, { userId: ownerId })).toEqual([]);
    expectNoWrites(db);
  });
});

describe('subscription cancellation', () => {
  it.each(rejectedCallers)(
    'rejects $name without cancellation or billing events',
    async ({ subject }) => {
      const { ctx, db, tables } = context(subject);
      const before = structuredClone(tables);
      await expect(getHandler(cancelSubscription)(ctx, { subscriptionId })).rejects.toThrow(
        'Unauthorized'
      );
      expectNoWrites(db);
      expect(tables).toEqual(before);
      if (subject !== other.clerkId) expect(db.get).not.toHaveBeenCalled();
    }
  );

  it('lets the owner cancel and records the existing cancellation event', async () => {
    const { ctx, db, tables } = context();
    await getHandler(cancelSubscription)(ctx, { subscriptionId });
    expect(db.patch).toHaveBeenCalledExactlyOnceWith(subscriptionId, {
      status: 'canceled',
      canceledAt: now,
      updatedAt: now,
    });
    expect(db.insert).toHaveBeenCalledExactlyOnceWith('billingEvents', {
      userId: ownerId,
      subscriptionId,
      type: 'subscription.canceled',
      amountCents: 0,
      currency: 'USD',
      description: 'Subscription canceled by user',
      createdAt: now,
    });
    expect(tables.subscriptions[0]).toEqual({
      ...subscription,
      status: 'canceled',
      canceledAt: now,
      updatedAt: now,
    });
  });

  it('does not write when the requested subscription is missing', async () => {
    const { ctx, db } = context(owner.clerkId, { subscriptions: [] });
    await expect(getHandler(cancelSubscription)(ctx, { subscriptionId })).rejects.toThrow(
      'Subscription not found'
    );
    expectNoWrites(db);
  });
});

describe('owner usage reads', () => {
  it.each([
    { service: 'chat', current: 100, limit: 400 },
    { service: 'search', current: 100, limit: 400 },
    { service: 'translate', current: 50, limit: 200 },
    { service: 'tts', current: 25, limit: 100 },
    { service: 'asr', current: 25, limit: 100 },
  ] as const)(
    'keeps $service counters and limits for the owner',
    async ({ service, current, limit }) => {
      const { ctx, db } = context();
      expect(
        await getHandler(checkUsageLimit)(ctx, { userId: ownerId, service, tier: 'learner' })
      ).toEqual({
        current,
        limit,
        remaining: limit - current,
        percentUsed: 25,
        allowed: true,
      });
      expectNoWrites(db);
    }
  );

  it("returns the owner's current period, minutes and tier limits", async () => {
    const { ctx, db } = context();
    expect(await getHandler(getUsageStats)(ctx, { userId: ownerId, tier: 'learner' })).toEqual({
      chat: { current: 100, limit: 400, percentUsed: 25 },
      translate: { current: 50, limit: 200, percentUsed: 25 },
      voice: { current: 25, limit: 100, minutes: 2.5, maxMinutes: 20, percentUsed: 25 },
      periodStart,
      periodEnd,
    });
    expectNoWrites(db);
  });

  it('keeps zero usage read-only when the owner has no usage record', async () => {
    const { ctx, db } = context(owner.clerkId, { usageTracking: [] });
    expect(
      await getHandler(checkUsageLimit)(ctx, { userId: ownerId, service: 'chat', tier: 'free' })
    ).toEqual({
      current: 0,
      limit: 300,
      remaining: 300,
      percentUsed: 0,
      allowed: true,
    });
    expect(await getHandler(getUsageStats)(ctx, { userId: ownerId, tier: 'free' })).toMatchObject({
      chat: { current: 0 },
      translate: { current: 0 },
      voice: { current: 0, minutes: 0 },
    });
    expectNoWrites(db);
  });
});

describe('existing subscription and internal accounting behavior', () => {
  it.each([null, 'clerk_missing'])(
    'does not start a subscription for unregistered identity %s',
    async (subject) => {
      const { ctx, db } = context(subject);
      await expect(getHandler(startSubscription)(ctx, { plan: 'learner' })).rejects.toThrow();
      expectNoWrites(db);
    }
  );

  it.each(['free', 'learner', 'fluent'] as const)(
    'starts %s only for the authenticated account',
    async (plan) => {
      const { ctx, db } = context();
      expect(await getHandler(startSubscription)(ctx, { plan })).toBe('new_subscriptions');
      expect(db.insert).toHaveBeenCalledExactlyOnceWith('subscriptions', {
        userId: ownerId,
        plan,
        status: plan === 'free' ? 'active' : 'pending',
        currentPeriodStart: now,
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
        createdAt: now,
        updatedAt: now,
        failedPaymentAttempts: 0,
      });
    }
  );

  it.each([
    { name: 'renewal', handler: recordRenewalAttempt, type: 'subscription.renewed' },
    { name: 'dunning', handler: recordDunningAttempt, type: 'payment.retried' },
  ])('keeps internal $name independent of end-user authentication', async ({ handler, type }) => {
    const { ctx, db, auth } = context(null);
    await getHandler(handler)(ctx, { subscriptionId });
    expect(auth.getUserIdentity).not.toHaveBeenCalled();
    expect(db.patch).toHaveBeenCalledExactlyOnceWith(subscriptionId, { updatedAt: now });
    expect(db.insert).toHaveBeenCalledExactlyOnceWith(
      'billingEvents',
      expect.objectContaining({
        userId: ownerId,
        subscriptionId,
        type,
        amountCents: 0,
        createdAt: now,
      })
    );
  });

  it('keeps internal usage recording independent of end-user authentication', async () => {
    const { ctx, db, auth } = context(null);
    await getHandler(recordUsage)(ctx, { userId: ownerId, service: 'chat' });
    expect(auth.getUserIdentity).not.toHaveBeenCalled();
    expect(db.patch).toHaveBeenCalledExactlyOnceWith(usage._id, { chatMessages: 101 });
  });
});

describe('handle update uniqueness', () => {
  it("rejects another user's handle before any profile changes", async () => {
    const { ctx, db, tables, indexReads } = context();
    const before = structuredClone(tables.users);
    await expect(
      getHandler(store)(ctx, { ...syncArgs, name: 'Changed', handle: ` ${other.handle} ` })
    ).rejects.toThrow('Handle is already taken');
    expectNoWrites(db);
    expect(tables.users).toEqual(before);
    expect(indexReads).toContainEqual({
      table: 'users',
      index: 'by_handle',
      predicates: [['handle', other.handle]],
    });
  });

  it('allows an unchanged self-sync without writes', async () => {
    const { ctx, db } = context();
    expect(await getHandler(store)(ctx, syncArgs)).toBe(ownerId);
    expectNoWrites(db);
  });

  it('allows profile sync with the same handle and preserves privacy choices', async () => {
    const { ctx, db, tables } = context();
    expect(await getHandler(store)(ctx, { ...syncArgs, name: 'Updated' })).toBe(ownerId);
    expect(db.patch).toHaveBeenCalledExactlyOnceWith(ownerId, {
      ...syncArgs,
      name: 'Updated',
      email: owner.email,
      emailVerified: true,
    });
    expect(tables.users[0]).toMatchObject({
      profileVisible: true,
      showChanga: true,
      voiceDataAllowed: false,
      culturalDataAllowed: false,
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('allows a unique rename using an indexed read in the mutation', async () => {
    const { ctx, db, tables, indexReads } = context();
    expect(await getHandler(store)(ctx, { ...syncArgs, handle: ' unique_handle ' })).toBe(ownerId);
    expect(db.patch).toHaveBeenCalledExactlyOnceWith(ownerId, {
      ...syncArgs,
      handle: 'unique_handle',
      email: owner.email,
      emailVerified: true,
    });
    expect(tables.users[0].handle).toBe('unique_handle');
    expect(indexReads).toContainEqual({
      table: 'users',
      index: 'by_handle',
      predicates: [['handle', 'unique_handle']],
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('rejects a handle claimed before a competing rename is retried', async () => {
    const state = context();
    await getHandler(store)(state.ctx, { ...syncArgs, handle: 'contested_handle' });
    // Convex retries a conflicting mutation against the committed state. This
    // fake verifies that re-execution observes the winner via the handle index;
    // it does not simulate the database's optimistic concurrency engine.
    const retry = context(other.clerkId, { users: state.tables.users });
    await expect(
      getHandler(store)(retry.ctx, { ...syncArgs, handle: 'contested_handle' })
    ).rejects.toThrow('Handle is already taken');
    expectNoWrites(retry.db);
    expect(retry.tables.users.filter((user) => user.handle === 'contested_handle')).toHaveLength(1);
  });

  it('rejects an existing duplicate target without repairing either record', async () => {
    const { ctx, db, tables } = context(owner.clerkId, {
      users: [
        { ...owner },
        { ...other },
        { ...other, _id: 'legacy_duplicate', clerkId: 'clerk_legacy' },
      ],
    });
    const before = structuredClone(tables.users);
    await expect(getHandler(store)(ctx, { ...syncArgs, handle: other.handle })).rejects.toThrow();
    expectNoWrites(db);
    expect(tables.users).toEqual(before);
  });

  it('rejects unauthenticated handle changes without writes', async () => {
    const { ctx, db } = context(null);
    await expect(getHandler(store)(ctx, { ...syncArgs, handle: 'unique_handle' })).rejects.toThrow(
      'without authentication'
    );
    expectNoWrites(db);
  });
});
