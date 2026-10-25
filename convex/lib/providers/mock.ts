/**
 * Dev-only mock AI provider for Convex.
 *
 * Re-exports the mock provider from `qa/mock-ai/provider.ts`. Registered
 * only by `convex/lib/providers/index.ts` when `QA_MOCK_AI=1` is set
 * server-side. Never active in production.
 */

export { mockProvider, extractScenario, stripScenario, CANNED_REPLIES } from "../../../qa/mock-ai/provider";
export type { MockScenario } from "../../../qa/mock-ai/provider";
