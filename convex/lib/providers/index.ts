/**
 * Provider registry. Imported once at module load by callers that
 * need to interact with providers directly. The router itself does
 * not need this — it manages its own singleton state.
 *
 * Adding a new provider:
 *   1. Implement it in `convex/lib/providers/<name>.ts` and export a
 *      `ChatProvider`-shaped object.
 *   2. Add the env-var(s) to `convex/lib/providers/<name>.ts` and to
 *      README.md.
 *   3. Register it below.
 *
 * Dev-only mock AI hook (Phase 2 QA):
 *   The mock provider lives in `qa/mock-ai/provider.ts` and is registered
 *   only when `QA_MOCK_AI=1` is set server-side via `npx convex env set
 *   QA_MOCK_AI 1`. This is a server-side Convex env var — it cannot be
 *   enabled via query string, header, cookie, or browser code. Never set
 *   QA_MOCK_AI=1 in production Convex deployments. To activate locally:
 *     npx convex env set QA_MOCK_AI 1
 *   Then Convex will use the mock provider instead of HuggingFace.
 */
import { setProviders } from "../aiRouter";
import { huggingfaceProvider } from "./huggingface";
import { fallbackProvider } from "./fallback";

const useMock = process.env.QA_MOCK_AI === "1";

if (useMock) {
  // Static import of the dev-only mock provider. Only active when
  // QA_MOCK_AI=1 is set server-side; never in production.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { mockProvider } = require("./mock");
  setProviders(mockProvider, fallbackProvider);
} else {
  setProviders(huggingfaceProvider, fallbackProvider);
}

export { huggingfaceProvider, fallbackProvider };
export { HF_CONSTANTS } from "./huggingface";

