import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../convex/lib/rateLimit";

type Counter = {
    _id: string;
    key: string;
    windowStart: number;
    count: number;
    updatedAt: number;
};

function createMockDb() {
    const rows: Counter[] = [];
    let nextId = 1;
    return {
        rows,
        query(table: string) {
            if (table !== "rateLimits") throw new Error(`Unexpected table ${table}`);
            return {
                withIndex: (_name: string, predicate?: (q: unknown) => unknown) => {
                    const captured: string[] = [];
                    if (predicate) {
                        predicate({
                            eq: (_field: string, value: string) => {
                                captured.push(value);
                            },
                        });
                    }
                    const keyFilter = captured[0] ?? null;
                    return {
                        collect: async () =>
                            rows.filter((r) => keyFilter === null || r.key === keyFilter),
                    };
                },
            };
        },
        async delete(id: string) {
            const idx = rows.findIndex((r) => r._id === id);
            if (idx !== -1) rows.splice(idx, 1);
        },
        async patch(id: string, patch: Partial<Counter>) {
            const row = rows.find((r) => r._id === id);
            if (row) Object.assign(row, patch);
        },
        async insert(table: string, doc: Omit<Counter, "_id">) {
            if (table !== "rateLimits") throw new Error(`Unexpected table ${table}`);
            rows.push({ ...doc, _id: `id${nextId++}` });
        },
    };
}

const HOUR = 60 * 60 * 1000;

describe("checkRateLimit", () => {
    it("allows requests up to the maximum", async () => {
        const db = createMockDb();
        const now = 1_000_000_000_000;
        for (let i = 0; i < 3; i++) {
            const result = await checkRateLimit(db as never, "test:key", HOUR, 3, now);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2 - i);
        }
        expect(db.rows.length).toBe(1);
        expect(db.rows[0].count).toBe(3);
    });

    it("blocks once the maximum is reached", async () => {
        const db = createMockDb();
        const now = 1_000_000_000_000;
        for (let i = 0; i < 3; i++) {
            await checkRateLimit(db as never, "test:key", HOUR, 3, now);
        }
        const blocked = await checkRateLimit(db as never, "test:key", HOUR, 3, now);
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
        expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });

    it("resets after the window elapses", async () => {
        const db = createMockDb();
        const now = 1_000_000_000_000;
        for (let i = 0; i < 3; i++) {
            await checkRateLimit(db as never, "test:key", HOUR, 3, now);
        }
        const later = now + HOUR + 1;
        const result = await checkRateLimit(db as never, "test:key", HOUR, 3, later);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
        // stale counter removed
        expect(db.rows.every((r) => r.windowStart + HOUR > later)).toBe(true);
    });

    it("tracks separate keys independently", async () => {
        const db = createMockDb();
        const now = 1_000_000_000_000;
        await checkRateLimit(db as never, "key:a", HOUR, 1, now);
        const other = await checkRateLimit(db as never, "key:b", HOUR, 1, now);
        expect(other.allowed).toBe(true);
        const blocked = await checkRateLimit(db as never, "key:a", HOUR, 1, now);
        expect(blocked.allowed).toBe(false);
    });

    it("sums counters across recent windows (sliding window)", async () => {
        const db = createMockDb();
        const now = 1_000_000_000_000;
        const windowMs = 1000;
        // 1 request in the previous window
        await checkRateLimit(db as never, "test:key", windowMs, 3, now - 500);
        // 2 requests in the current window
        await checkRateLimit(db as never, "test:key", windowMs, 3, now);
        await checkRateLimit(db as never, "test:key", windowMs, 3, now);
        const blocked = await checkRateLimit(db as never, "test:key", windowMs, 3, now);
        expect(blocked.allowed).toBe(false);
    });
});