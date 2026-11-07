# 0002 — The AI layer is defined by interfaces, not by providers

- **Status:** Accepted
- **Date:** 2026-11-07
- **Context:** The brief requires that "the frontend must not directly depend
  on a particular translation model or reasoning provider", and asks for
  `TranslationService`, `ReasoningService`, `SpeechRecognitionService` and
  `SpeechSynthesisService` interfaces.

## Decision

Four interfaces live in `lib/ai/types.ts`. Providers implement them. The
provider is chosen at runtime from the environment by
`resolveAiRuntime()` in `lib/ai/index.ts`.

- `TranslationService` — `translate()`, `detectLanguage()`
- `ReasoningService` — `stream(request, signal)` as an async generator
- `SpeechRecognitionService` — `transcribe()`
- `SpeechSynthesisService` — `synthesize()`

Shipped providers:

| Provider | File | Selected when |
| --- | --- | --- |
| `OpenAICompatibleReasoningService` | `lib/ai/providers/openai-compatible.ts` | `SAMIATI_REASONING_API_KEY` or `OPENAI_API_KEY` is set |
| `HuggingFaceTranslationService` | `lib/ai/providers/huggingface.ts` | `HUGGINGFACE_API_KEY` is set |
| `MockReasoningService`, `MockTranslationService` | `lib/ai/providers/mock.ts` | Nothing else is configured |

Every provider exposes `isMock`. The UI labels mock replies explicitly, so a
placeholder is never presented as a model answer.

## Why

African language support is fragmented across providers that come and go.
Hardcoding one would make the product fragile and would make local inference
impossible. An interface also makes the pipeline testable without a network:
`tests/pipeline.test.ts` drives the full pipeline with fake providers.

## Consequences

- No provider SDK is a dependency — the reasoning adapter uses `fetch`
  against the OpenAI-compatible chat-completions shape, so OpenRouter, Groq,
  Together, vLLM and Ollama all work from one adapter.
- Adding a provider is one file plus one branch in `resolveAiRuntime()`.
- The mock provider must stay obviously fake. It is the default, and it says
  so in every reply it produces.

## References

- [`docs/ai-pipeline.md`](../ai-pipeline.md)
