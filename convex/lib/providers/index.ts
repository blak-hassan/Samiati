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
 */
import { setProviders } from "../aiRouter";
import { huggingfaceProvider } from "./huggingface";
import { fallbackProvider } from "./fallback";

setProviders(huggingfaceProvider, fallbackProvider);

export { huggingfaceProvider, fallbackProvider };
export { HF_CONSTANTS } from "./huggingface";
