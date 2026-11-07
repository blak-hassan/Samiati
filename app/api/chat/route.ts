import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { resolveAiRuntime } from "@/lib/ai";
import { runChatPipeline, type PipelineMessage } from "@/lib/ai/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  message: z.string().min(1).max(20_000),
  languageId: z.string().min(1).max(40),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(20_000),
      }),
    )
    .max(100)
    .default([]),
});

/**
 * The Samiati chat endpoint.
 *
 * It runs the translation → reasoning → translation pipeline on the server
 * (where the API keys live) and streams the result back as newline-delimited
 * JSON so the client can show progress, the live reasoning stream, and the
 * final translated answer.
 */
export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof requestSchema>;

  try {
    parsed = requestSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "That request was not valid."
            : "Could not read the request.",
      },
      { status: 400 },
    );
  }

  const runtime = resolveAiRuntime();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const events = runChatPipeline(
          {
            translation: runtime.translation,
            reasoning: runtime.reasoning,
          },
          {
            userMessage: parsed.message,
            languageId: parsed.languageId,
            history: parsed.history as PipelineMessage[],
            signal: request.signal,
          },
        );

        for await (const event of events) {
          send(event);
          if (event.type === "final" || event.type === "error") break;
        }
      } catch (error) {
        send({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "The assistant could not complete that reply.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering so tokens reach the browser as they arrive.
      "X-Accel-Buffering": "no",
    },
  });
}
