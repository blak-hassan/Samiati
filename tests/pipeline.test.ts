import { describe, expect, it } from "vitest";

import { runChatPipeline, type PipelineEvent } from "@/lib/ai/pipeline";
import type {
  ReasoningChunk,
  ReasoningRequest,
  ReasoningService,
  TranslationRequest,
  TranslationResult,
  TranslationService,
} from "@/lib/ai/types";

/** A translation service that records every call it receives. */
class RecordingTranslationService implements TranslationService {
  readonly id = "recording";
  readonly label = "Recording translator";
  readonly isMock = false;
  readonly supportedLanguageIds = ["en", "kiswahili"];

  calls: TranslationRequest[] = [];
  /** When set, only this source → target direction fails. */
  failDirection?: { from: string; to: string };

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    this.calls.push(request);
    if (
      this.failDirection &&
      request.sourceLanguageId === this.failDirection.from &&
      request.targetLanguageId === this.failDirection.to
    ) {
      throw new Error("translation model unavailable");
    }
    return {
      text: `[${request.targetLanguageId}] ${request.text}`,
      provider: this.id,
      isMock: false,
    };
  }

  async detectLanguage() {
    return { languageId: "en", confidence: 1, isMock: false };
  }
}

/** A reasoning service that returns a fixed answer. */
class FixedReasoningService implements ReasoningService {
  readonly id = "fixed";
  readonly label = "Fixed reasoner";
  readonly isMock = false;
  readonly defaultModel = "test-model";

  requests: ReasoningRequest[] = [];

  async *stream(request: ReasoningRequest): AsyncGenerator<ReasoningChunk> {
    this.requests.push(request);
    yield { delta: "The answer ", provider: this.id, model: this.defaultModel };
    yield { delta: "is forty-two.", provider: this.id, model: this.defaultModel };
    yield { delta: "", done: true, provider: this.id, model: this.defaultModel };
  }
}

async function collect(events: AsyncGenerator<PipelineEvent>) {
  const collected: PipelineEvent[] = [];
  for await (const event of events) collected.push(event);
  return collected;
}

describe("chat pipeline", () => {
  it("translates in, reasons, and translates back", async () => {
    const translation = new RecordingTranslationService();
    const reasoning = new FixedReasoningService();

    const events = await collect(
      runChatPipeline(
        { translation, reasoning },
        {
          userMessage: "Habari za asubuhi",
          languageId: "kiswahili",
          history: [],
        },
      ),
    );

    const final = events.find((event) => event.type === "final");
    expect(final).toBeDefined();
    if (final?.type !== "final") throw new Error("expected a final event");

    // The input was translated into English for the reasoning model.
    expect(translation.calls[0]?.sourceLanguageId).toBe("kiswahili");
    expect(translation.calls[0]?.targetLanguageId).toBe("en");

    // The answer was translated back into the user's language.
    const outputCall = translation.calls.at(-1);
    expect(outputCall?.sourceLanguageId).toBe("en");
    expect(outputCall?.targetLanguageId).toBe("kiswahili");

    expect(final.text.startsWith("[kiswahili]")).toBe(true);
    expect(final.meta.translated).toBe(true);
    expect(final.meta.pipeline).toBe("translated");
    expect(final.meta.reasoningModel).toBe("test-model");
  });

  it("does not translate at all when the user is chatting in English", async () => {
    const translation = new RecordingTranslationService();
    const reasoning = new FixedReasoningService();

    const events = await collect(
      runChatPipeline(
        { translation, reasoning },
        { userMessage: "Hello", languageId: "en", history: [] },
      ),
    );

    expect(translation.calls).toHaveLength(0);
    const final = events.find((event) => event.type === "final");
    if (final?.type !== "final") throw new Error("expected a final event");
    expect(final.meta.translated).toBe(false);
    expect(final.meta.pipeline).toBe("direct");
  });

  it("translates each history message only once per turn", async () => {
    const translation = new RecordingTranslationService();
    const reasoning = new FixedReasoningService();

    await collect(
      runChatPipeline(
        { translation, reasoning },
        {
          userMessage: "Tena?",
          languageId: "kiswahili",
          history: [
            { role: "user", content: "Habari" },
            { role: "assistant", content: "Nzuri" },
          ],
        },
      ),
    );

    // One call for the new message, one for each history message, one for the
    // output. No message is translated twice.
    const inputCalls = translation.calls.filter(
      (call) => call.targetLanguageId === "en",
    );
    expect(inputCalls).toHaveLength(3);
    expect(new Set(inputCalls.map((call) => call.text)).size).toBe(3);
  });

  it("degrades honestly when the output translation fails", async () => {
    const translation = new RecordingTranslationService();
    const reasoning = new FixedReasoningService();

    // Fail only for the English → Kiswahili direction.
    translation.failDirection = { from: "en", to: "kiswahili" };

    const failing = await collect(
      runChatPipeline(
        { translation, reasoning },
        { userMessage: "Habari", languageId: "kiswahili", history: [] },
      ),
    );

    const final = failing.find((event) => event.type === "final");
    if (final?.type !== "final") throw new Error("expected a final event");

    // The English answer is still delivered, and the metadata says so.
    expect(final.text).toContain("forty-two");
    expect(final.meta.translated).toBe(false);
    expect(final.meta.inputTranslated).toBe(true);
    expect(final.meta.pipeline).toBe("direct");

    const stages = failing.filter((event) => event.type === "stage");
    expect(
      stages.some((stage) => stage.message?.includes("Translation unavailable")),
    ).toBe(true);
  });

  it("still answers when the input translation fails", async () => {
    const translation = new RecordingTranslationService();
    const reasoning = new FixedReasoningService();

    // Fail only for the Kiswahili → English direction.
    translation.failDirection = { from: "kiswahili", to: "en" };

    const events = await collect(
      runChatPipeline(
        { translation, reasoning },
        { userMessage: "Habari", languageId: "kiswahili", history: [] },
      ),
    );

    const final = events.find((event) => event.type === "final");
    if (final?.type !== "final") throw new Error("expected a final event");

    // The user's original text reached the reasoning model.
    expect(reasoning.requests[0]?.messages.at(-1)?.content).toBe("Habari");

    // The reply was still translated back into Kiswahili, but the metadata
    // records that the request itself was not translated.
    expect(final.meta.translated).toBe(true);
    expect(final.meta.inputTranslated).toBe(false);

    const stages = events.filter((event) => event.type === "stage");
    expect(
      stages.some((stage) => stage.message?.includes("Could not translate")),
    ).toBe(true);
  });

  it("surfaces a reasoning failure as an error event rather than throwing", async () => {
    const translation = new RecordingTranslationService();
    const reasoning: ReasoningService = {
      id: "broken",
      label: "Broken reasoner",
      isMock: false,
      defaultModel: "broken",
      // eslint-disable-next-line require-yield
      async *stream() {
        throw new Error("the model exploded");
      },
    };

    const events = await collect(
      runChatPipeline(
        { translation, reasoning },
        { userMessage: "Hello", languageId: "en", history: [] },
      ),
    );

    const error = events.find((event) => event.type === "error");
    expect(error).toBeDefined();
    if (error?.type !== "error") throw new Error("expected an error event");
    expect(error.message).toContain("the model exploded");
  });

  it("passes the target language to the reasoning service", async () => {
    const translation = new RecordingTranslationService();
    const reasoning = new FixedReasoningService();

    await collect(
      runChatPipeline(
        { translation, reasoning },
        { userMessage: "Habari", languageId: "kiswahili", history: [] },
      ),
    );

    expect(reasoning.requests[0]?.outputLanguageId).toBe("kiswahili");
    expect(reasoning.requests[0]?.messages.at(-1)?.role).toBe("user");
  });
});
