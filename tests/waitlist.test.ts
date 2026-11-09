import { describe, it, expect } from "vitest";
import { joinWaitlist, getWaitlistCount } from "../convex/waitlist/utils";

type Row = { _id: string; [key: string]: unknown };

function createMockCtx(identity: { subject: string } | null = null) {
    const tables: Record<string, Row[]> = {
        waitlist: [],
        waitlistStats: [],
    };
    let nextId = 1;

    const db = {
        query(table: string) {
            const rows = tables[table];
            if (!rows) throw new Error(`Unexpected table ${table}`);
            return {
                withIndex(_name: string, predicate?: (q: unknown) => unknown) {
                    const filters: { field: string; value: unknown }[] = [];
                    predicate?.({
                        eq: (field: string, value: unknown) => {
                            filters.push({ field, value });
                        },
                    });
                    const matches = () =>
                        rows.filter((row) =>
                            filters.every((filter) => row[filter.field] === filter.value),
                        );
                    return {
                        first: async () => matches()[0] ?? null,
                        unique: async () => {
                            const found = matches();
                            if (found.length > 1) throw new Error("Duplicate unique row");
                            return found[0] ?? null;
                        },
                    };
                },
            };
        },
        async insert(table: string, doc: Record<string, unknown>) {
            if (!tables[table]) throw new Error(`Unexpected table ${table}`);
            const row: Row = { _id: `id${nextId++}`, ...doc };
            tables[table].push(row);
            return row._id;
        },
        async patch(id: string, patch: Record<string, unknown>) {
            for (const rows of Object.values(tables)) {
                const row = rows.find((r) => r._id === id);
                if (row) Object.assign(row, patch);
            }
        },
    };

    return {
        db,
        auth: {
            getUserIdentity: async () => identity,
        },
    } as never;
}

describe("joinWaitlist", () => {
    it("lets a guest join and initializes the counter", async () => {
        const ctx = createMockCtx(null);
        const result = await joinWaitlist(ctx, { visitorId: "visitor-abc" });
        expect(result).toEqual({ alreadyJoined: false, position: 1 });
        expect(await getWaitlistCount(ctx)).toBe(1);
    });

    it("is idempotent for the same visitor id", async () => {
        const ctx = createMockCtx(null);
        await joinWaitlist(ctx, { visitorId: "visitor-abc" });
        const second = await joinWaitlist(ctx, { visitorId: "visitor-abc" });
        expect(second).toEqual({ alreadyJoined: true, position: 1 });
        expect(await getWaitlistCount(ctx)).toBe(1);
    });

    it("keys signed-in joins by Clerk subject and ignores the visitor id", async () => {
        const ctx = createMockCtx({ subject: "user_abc" });
        const first = await joinWaitlist(ctx, { visitorId: "visitor-xyz" });
        expect(first).toEqual({ alreadyJoined: false, position: 1 });

        const second = await joinWaitlist(ctx, {});
        expect(second).toEqual({ alreadyJoined: true, position: 1 });
        expect(await getWaitlistCount(ctx)).toBe(1);
    });

    it("rejects guests without a visitor id", async () => {
        const ctx = createMockCtx(null);
        await expect(joinWaitlist(ctx, {})).rejects.toThrow(/Missing visitor identity/);
    });

    it("increments position across different visitors", async () => {
        const ctx = createMockCtx(null);
        await joinWaitlist(ctx, { visitorId: "visitor-one" });
        const second = await joinWaitlist(ctx, { visitorId: "visitor-two" });
        expect(second).toEqual({ alreadyJoined: false, position: 2 });
        expect(await getWaitlistCount(ctx)).toBe(2);
    });
});
