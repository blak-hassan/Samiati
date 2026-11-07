# The Samiati AI Pipeline

How a message becomes an answer, and what happens when a step fails.

---

## 1. The model

```
User Input (language L)
        │
        ▼
  ┌────────────────────┐
  │ Language detection │  (heuristic; reserved for a future MT-based detector)
  └────────────────────┘
        │
        ▼
  ┌────────────────────┐
  │ Translate → English│  TranslationService.translate(L → en)
  └────────────────────┘
        │
        ▼
  ┌────────────────────┐
  │ Reasoning model   │  ReasoningService.stream() — answers in English
  └────────────────────┘
        │
        ▼
  ┌────────────────────┐
  │ Translate → L     │  TranslationService.translate(en → L)
  └────────────────────┘
        │
        ▼
     Reply (in L)
```

English is the pivot language. It is the only language every reasoning model
is strong in, and the only language with a genuinely competitive translation
model. Samiati isolates that constraint in one place — the pipeline — rather
than leaking it into the product.

---

## 2. The service interfaces

Defined in `lib/ai/types.ts`. Everything in the product talks to these, never
to a provider SDK.

```ts
interface TranslationService {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  readonly supportedLanguageIds: readonly string[];
  translate(request: TranslationRequest): Promise<TranslationResult>;
  detectLanguage(text: string): Promise<LanguageDetection>;
}

interface ReasoningService {
  readonly id: string;
  readonly label: string;
  readonly isMock: boolean;
  readonly defaultModel: string;
  stream(
    request: ReasoningRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ReasoningChunk>;
}

interface SpeechRecognitionService {
  transcribe(audio: Blob, languageId: string): Promise<SpeechRecognitionResult>;
}

interface SpeechSynthesisService {
  synthesize(text: string, languageId: string): Promise<SpeechSynthesisResult>;
}
```

The two speech interfaces are defined but **not implemented** in this release.
They are specified so that the voice feature has a stable shape when it
lands, and so no component has to be rewritten to accommodate it.

---

## 3. The shipped providers

### 3.1 Reasoning — `OpenAICompatibleReasoningService`

`lib/ai/providers/openai-compatible.ts`

One adapter covers every OpenAI-compatible endpoint:

| Configuration | Meaning |
| --- | --- |
| `SAMIATI_REASONING_BASE_URL` / `OPENAI_BASE_URL` | Any OpenAI-compatible base URL |
| Default | `https://api.openai.com/v1` |
| `SAMIATI_REASONING_MODEL` / `OPENAI_MODEL` | Model id, default `gpt-4o-mini` |

Because the base URL is configurable, the same code path serves OpenAI,
OpenRouter, Groq, Together, a self-hosted vLLM, or an Ollama server on a
LAN. That matters for Samiati: a national deployment may run its own models.

**Cost.** The reasoning model is the only per-request cost. `gpt-4o-mini` is
roughly USD 0.15 per million input tokens and USD 0.60 per million output
tokens. A typical Samiati turn (system prompt + history + a short answer) is
roughly 1,000–2,000 tokens in and 200–500 tokens out, so a turn costs
approximately **USD 0.0002–0.0005**. A user sending 50 messages a day spends
about USD 0.01–0.02.

### 3.2 Translation — `HuggingFaceTranslationService`

`lib/ai/providers/huggingface.ts`

Uses the Hugging Face inference API with Meta's **NLLB-200** family
(`facebook/nllb-200-distilled-600M` by default). NLLB-200 covers 200
languages and is the most capable openly-licensed option for low-resource
languages.

Samiati's stable language ids map onto NLLB's FLORES codes in exactly one
place:

| Samiati id | FLORES code | Samiati id | FLORES code |
| --- | --- | --- | --- |
| `en` | `eng_Latn` | `kamba` | `kam_Latn` |
| `kiswahili` | `swh_Latn` | `kalenjin` | `kln_Latn` |
| `sheng` | `swh_Latn` | `gusii` | `ggc_Latn` |
| `kikuyu` | `kik_Latn` | `meru` | `mer_Latn` |
| `luhya` | `luy_Latn` | `maasai` | `mas_Latn` |
| `dholuo` | `luo_Latn` | `somali` | `som_Latn` |

If a pair has no mapping, the provider **throws** rather than guessing. It
never silently produces a wrong translation.

> Coverage caveat: NLLB's per-language quality varies, and a code in the
> table does not guarantee good quality for that language. This is exactly
> why the registry carries a `translation` coverage level per language, and
> why Changa exists.

**Cost.** Hugging Face's free tier covers occasional use. For production, a
dedicated NLLB deployment on a small GPU is a few hundred US dollars per
month and serves the whole user base at no per-token cost.

### 3.3 The placeholder providers

`lib/ai/providers/mock.ts`

Used when no key is configured. They are **not** models:

- The mock translator returns the source text unchanged and sets
  `isMock: true`.
- The mock reasoner returns a short, clearly-labelled demo reply that greets
  the user in their own language, states that no model is connected, and
  points at the parts of Samiati that already work.

Every reply they produce is badged **"Demo placeholder — no model connected"**
in the UI. Samiati never pretends a mock is a model.

### 3.4 Language detection

`HeuristicLanguageDetector` looks for characters and function words
characteristic of each supported language. It is deliberately conservative:
when nothing matches it returns English with zero confidence rather than
guessing.

It exists so the pipeline has a complete shape today. A future
translation-model-based detector replaces it without touching the pipeline,
because `TranslationService.detectLanguage` is already the seam.

---

## 4. The pipeline in detail

`lib/ai/pipeline.ts` — `runChatPipeline(deps, input)` is an async generator
over `PipelineEvent`s.

### 4.1 Step 1 — translate the input in

The user's message is translated from language L into English. The prior
conversation is translated too, so the reasoning model sees a coherent
English thread.

**Duplicate-request avoidance.** A `Map` cache keyed by
`` `${languageId}::${text}` `` holds every translation for the turn. The same
sentence appearing twice in the history is translated once. The cache lives
for the duration of a turn only — a longer-lived cache would need an
invalidation policy and is not worth the complexity yet.

### 4.2 Step 2 — build the context

The reasoning model receives:

```
system:  SAMIATI_SYSTEM_PROMPT
user:    <translated history, oldest first>
user:    <translated new message>
```

`SAMIATI_SYSTEM_PROMPT` tells the model that it is answering a user in a
specific African language, that the conversation has already been translated
into English, and that its answer will be translated back. It also instructs
the model to say so plainly when it is unsure about a local term rather than
inventing a translation — which reduces the most damaging failure mode of a
translation-based assistant.

### 4.3 Step 3 — reason

The reasoning model streams. Every chunk is emitted as a `delta` event with
`stage: "reasoning"`, so the user sees the answer being written.

The stream respects an `AbortSignal`, so the **Stop** button genuinely stops
generation at the provider.

### 4.4 Step 4 — translate the answer out

The complete English answer is translated back into language L and emitted as
a `delta` event with `stage: "translation"`, replacing the English text on
screen.

### 4.5 Step 5 — finalise

A `final` event carries the text and the `MessageMeta`:

```ts
interface MessageMeta {
  pipeline: "direct" | "translated" | "mock";
  reasoningModel?: string;
  translationModel?: string;
  reasoningLanguageId?: string;
  translated: boolean;         // the reply was translated into L
  inputTranslated?: boolean;   // the request was translated into English
  translationConfidence?: number;
  tokensUsed?: number;
  latencyMs?: number;
}
```

`translated` and `inputTranslated` are separate because they can differ: the
reply may have been translated successfully even when the request was not.
The UI uses these to label the reply honestly.

---

## 5. Failure behaviour

Every failure mode degrades rather than crashes, and every degradation is
reported.

| Failure | Behaviour | User sees |
| --- | --- | --- |
| Input translation fails | The original text is sent to the reasoning model. `inputTranslated: false`. | "Could not translate from Kiswahili (…). Continuing with your original text." |
| Reasoning model fails | The pipeline yields an `error` event. The assistant message is persisted with `status: "error"`. | An alert with the reason, and a retry control. |
| Output translation fails | The English answer is delivered. `translated: false`. | "Translation unavailable (…). Showing the English answer." and the **Translated from English** badge is *not* shown. |
| The user stops the stream | The partial text is kept and persisted. | The partial reply, complete and editable. |
| The provider rate-limits | Treated as a reasoning failure, with the provider's message surfaced. | The provider's own error text. |

The rule: **the user is never silently given an English answer inside a
Kiswahili conversation, and never shown a fake translation.**

---

## 5a. Streaming translation

The original design translated the answer in one call, after the model had
finished writing it. That left the reader waiting — and watching English they
did not ask for.

Samiati now translates **sentence by sentence, as the model writes**:

```
model writes "Habari za asubuhi ni ..."   ──▶ window holds the fragment
model writes "... ni siku nzuri."          ──▶ sentence complete ──▶ translated
model writes "Ukiwa mzima?"                ──▶ sentence complete ──▶ translated
```

`lib/ai/sentence-window.ts` implements the window. It has to be careful about
where a sentence ends:

| Case | Behaviour |
| --- | --- |
| "Hello there. How are you?" | Two sentences. |
| "Dr. Smith arrived late." | One sentence — "Dr." is an abbreviation. |
| "It costs 3.50" | Not split — the full stop is inside a number. |
| "Signed by J." | Not split — a single capital letter is an initial. |
| "Hi." | Held back until more text arrives; too short to translate alone. |

The user sees their own language as it arrives. The English the model wrote
stays available in a **"Show the English the model wrote"** disclosure, so the
translation is never a black box.

The trade-off: each sentence is a separate translation request. For a typical
reply that is three to six requests instead of one. The cost is small (a
sentence is a few dozen tokens) and the latency win is large.

---

## 5b. Translation routing

Different languages need different models. `lib/ai/router.ts` holds an ordered
list of routes and picks the first that covers both ends of a language pair:

```
dedicated-kiswahili  →  Kiswahili ⇄ English
general              →  everything else
```

A dedicated model wins because it is listed first. The router is itself a
`TranslationService`, so the pipeline does not know that routing exists. If no
route covers a pair, the router **throws** rather than guessing — the same
rule the Hugging Face provider follows.

---

## 5c. Voice

Voice uses the browser's Web Speech API (`lib/ai/browser-voice.ts`). It is
the only option that works on a phone without downloading a model, which
matters for the bandwidth Samiati targets.

**The honest limits**, which the UI states rather than hides:

| Language | Dictation and speech |
| --- | --- |
| English | `en-US` |
| Kiswahili | `sw-KE` |
| Sheng | `sw-KE` — the closest standard tag; Sheng has none of its own |
| Somali | `so-SO` |
| Kikuyu, Dholuo, Luhya, Kamba, Kalenjin, Gusii, Meru, Maasai | Not available — no standard locale exists |

A message dictated in a language the browser cannot recognise is still
translated exactly the same way as a typed one. Voice is an input
convenience, never a requirement.

The `SpeechRecognitionService` and `SpeechSynthesisService` interfaces remain
in `lib/ai/types.ts` for server-side ASR and TTS providers. The browser path
lives separately because the Web Speech API recognises a *live session* rather
than a recorded file, which the interface does not model.

---
## 6. What the pipeline deliberately does not do yet

| Not implemented | Why | When |
| --- | --- | --- |
| Streaming translation | No provider offers reliable, cheap streaming MT for all target languages. | Phase 6, per language. |
| Language identification by model | The heuristic is adequate for the MVP and costs nothing. | Phase 6. |
| Retrieval over Changa data | Needs the dataset pipeline to exist first. | Phase 6. |
| Tool use / function calling | Needs a tool registry and an approval UX. | Phase 6. |
| Per-language prompt tuning | Needs community review of outputs. | Phase 6. |

---

## 7. Testing

`tests/pipeline.test.ts` drives the whole pipeline with fake providers and
asserts:

- the input is translated into English and the answer back into the user's
  language;
- an English conversation performs **no** translation calls at all;
- each history message is translated exactly once;
- an output-translation failure still delivers the answer and reports it;
- an input-translation failure still answers and reports it;
- a reasoning failure surfaces as an `error` event rather than an exception.

The tests found three real defects during development, all of which were
fixed: English was missing from the registry (so English chats were being
translated), a failed input translation aborted the turn instead of
degrading, and the metadata could not distinguish "reply translated" from
"request translated".

