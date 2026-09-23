/**
 * Server-side observability helpers for Convex actions/mutations.
 *
 * Why this is not `@sentry/nextjs`:
 * Convex functions run in Convex's V8 isolate, not in the Next.js server
 * runtime. Importing `@sentry/nextjs` (or `@sentry/node`) inside a Convex
 * function either fails at import time or silently no-ops, because the
 * SDKs expect Node.js APIs that are not available in that environment.
 *
 * For now we emit structured `console.warn` / `console.error` lines that
 * Convex's log pipeline ingests into its dashboard. In production these
 * can be drained to Sentry/Datadog/CloudWatch via Convex's log-export
 * configuration (see Convex dashboard → Settings → Logs).
 *
 * If/when a real Sentry SDK is wired in for Convex, replace these
 * helpers with a thin wrapper that calls that SDK. The call sites below
 * (AI service error paths, quota events) will not need to change.
 */

type Level = "info" | "warning" | "error";

function emit(level: Level, message: string, context: Record<string, unknown>) {
    const line = JSON.stringify({
        ts: new Date().toISOString(),
        level,
        message,
        ...context,
    });
    if (level === "error") {
        console.error(line);
    } else if (level === "warning") {
        console.warn(line);
    } else {
        console.log(line);
    }
}

export function captureException(
    error: unknown,
    context: Record<string, unknown> = {},
): void {
    const err = error instanceof Error ? error : new Error(String(error));
    emit("error", err.message, {
        ...context,
        stack: err.stack,
        name: err.name,
    });
}

export function captureMessage(
    message: string,
    options: { level?: Level; tags?: Record<string, string>; extra?: Record<string, unknown> } = {},
): void {
    emit(options.level ?? "info", message, {
        tags: options.tags,
        extra: options.extra,
    });
}
