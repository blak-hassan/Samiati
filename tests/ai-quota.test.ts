import { describe, it, expect } from "vitest";
import { AI_SERVICE_LIMITS, estimateRemaining, type AiService, type PlanTier } from "../convex/lib/aiQuota";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

describe("AI_SERVICE_LIMITS", () => {
    it("defines bounded quotas for every AI service across all tiers", () => {
        const tiers: PlanTier[] = ["free", "learner", "fluent", "organization"];
        const services: AiService[] = ["asr", "chat", "search", "translate", "tts"];

        for (const tier of tiers) {
            for (const service of services) {
                const limits = AI_SERVICE_LIMITS[tier][service];
                expect(limits.hourly.max).toBeGreaterThan(0);
                expect(limits.hourly.windowMs).toBeLessThanOrEqual(HOUR);
                expect(limits.daily.max).toBeGreaterThanOrEqual(limits.hourly.max);
                expect(limits.daily.windowMs).toBe(DAY);
            }
        }
    });

    it("caps daily usage below any plausible cost-explosion threshold for free tier", () => {
        const services: AiService[] = ["chat", "search", "translate", "tts", "asr"];
        const totalPerDay = services.reduce(
            (sum, service) => sum + AI_SERVICE_LIMITS.free[service].daily.max,
            0
        );
        expect(totalPerDay).toBeLessThan(1000);
    });

    it("higher tiers have higher limits than free tier", () => {
        const services: AiService[] = ["chat", "search", "translate", "tts", "asr"];
        for (const service of services) {
            expect(AI_SERVICE_LIMITS.learner[service].daily.max)
                .toBeGreaterThanOrEqual(AI_SERVICE_LIMITS.free[service].daily.max);
            expect(AI_SERVICE_LIMITS.fluent[service].daily.max)
                .toBeGreaterThanOrEqual(AI_SERVICE_LIMITS.learner[service].daily.max);
        }
    });
});

describe("estimateRemaining", () => {
    it("returns the full quota with no counters", () => {
        expect(estimateRemaining([], { windowMs: HOUR, max: 30 }, 0)).toBe(30);
    });

    it("subtracts recent counters", () => {
        const now = 1_000_000_000_000;
        const counters = [
            { windowStart: now - (now % HOUR), count: 4 },
        ];
        expect(estimateRemaining(counters, { windowMs: HOUR, max: 30 }, now)).toBe(26);
    });

    it("ignores expired counters", () => {
        const now = 1_000_000_000_000;
        const counters = [{ windowStart: now - HOUR - 1, count: 99 }];
        expect(estimateRemaining(counters, { windowMs: HOUR, max: 30 }, now)).toBe(30);
    });

    it("never returns negative", () => {
        const now = 1_000_000_000_000;
        const counters = [{ windowStart: now - (now % HOUR), count: 40 }];
        expect(estimateRemaining(counters, { windowMs: HOUR, max: 30 }, now)).toBe(0);
    });
});
