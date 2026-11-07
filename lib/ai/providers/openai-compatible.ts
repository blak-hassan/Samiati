import type {
  ReasoningChunk,
  ReasoningRequest,
  ReasoningService,
} from "../types";

export interface OpenAICompatibleOptions {
  /** e.g. "https://openrouter.ai/api/v1" */
  baseUrl: string;
  apiKey: string;
  model: string;
  id?: string;
  label?: string;
}

/**
 * Reasoning provider for any OpenAI-compatible chat-completions endpoint.
 *
 * This one adapter covers a lot of ground: OpenRouter, Groq, Together,
 * Together's OpenAI-compatible endpoints, a self-hosted vLLM or Ollama server,
 * or a private gateway. Samiati never hardcodes one of them — the base URL and
 * model come from the environment.
 */
export class OpenAICompatibleReasoningService implements ReasoningService {
  readonly id: string;
  readonly label: string;
  readonly isMock = false;
  readonly defaultModel: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(options: OpenAICompatibleOptions) {
    this.id = options.id ?? "openai-compatible";
    this.label = options.label ?? `Reasoning model (${options.model})`;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.defaultModel = options.model;
  }

  async *stream(
    request: ReasoningRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ReasoningChunk> {
    const messages = [
      ...(request.system
        ? [{ role: "system" as const, content: request.system }]
        : []),
      ...request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model ?? this.defaultModel,
        messages,
        stream: true,
        temperature: request.temperature ?? 0.6,
        max_tokens: request.maxTokens,
      }),
      signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Reasoning model request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let tokensUsed: number | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          let parsed: {
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { completion_tokens?: number; total_tokens?: number };
          };
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }

          if (parsed.usage) {
            tokensUsed =
              parsed.usage.total_tokens ?? parsed.usage.completion_tokens ?? tokensUsed;
          }

          const delta = parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            yield {
              delta,
              provider: this.id,
              model: request.model ?? this.defaultModel,
            };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield {
      delta: "",
      done: true,
      provider: this.id,
      model: request.model ?? this.defaultModel,
      tokensUsed,
    };
  }
}
