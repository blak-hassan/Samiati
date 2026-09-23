/**
 * CSP violation report endpoint.
 *
 * Browsers POST to this URL when a CSP directive is violated. We log
 * structured JSON for each violation and forward to Sentry (in
 * non-test environments).
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri
 *
 * The endpoint accepts the modern `application/csp-report` content
 * type as well as the legacy `application/json` shape (some browsers
 * still use the latter). It is intentionally unauthenticated —
 * browsers are the callers and they don't carry user cookies.
 */
import { NextResponse } from "next/server";

// runtime: edge — why: pure parse + log, no Node-only APIs, no Convex calls,
// and CSP reports are latency-insensitive but called from every page load.
// Edge keeps cold-start minimal. Per docs/perf.md §1.
export const runtime = "edge";

interface CspReport {
    "csp-report"?: {
        "document-uri"?: string;
        "violated-directive"?: string;
        "effective-directive"?: string;
        "original-policy"?: string;
        "blocked-uri"?: string;
        "line-number"?: number;
        "column-number"?: number;
        "source-file"?: string;
        "status-code"?: number;
        "script-sample"?: string;
    };
    // Modern format may also be a flat object.
    documentUri?: string;
    violatedDirective?: string;
    blockedUri?: string;
}

export async function POST(request: Request) {
    let body: CspReport | null = null;
    const contentType = request.headers.get("content-type") || "";
    try {
        if (contentType.includes("application/csp-report") || contentType.includes("application/json")) {
            body = await request.json() as CspReport;
        } else {
            // Some browsers send `application/csp-report` as a
            // `text/plain` body; try to parse anyway.
            const text = await request.text();
            body = JSON.parse(text);
        }
    } catch {
        // Malformed body. Return 204 (No Content) per the spec;
        // the browser doesn't need a response body.
        return new NextResponse(null, { status: 204 });
    }

    // The body is one of two shapes:
    //   - { "csp-report": { "violated-directive": ..., ... } } (modern)
    //   - { violatedDirective: ..., blockedUri: ..., documentUri: ..., scriptSample: ... } (legacy / flat)
    // Normalize to a single shape for the rest of the handler.
    const raw = body?.["csp-report"] ?? body ?? {};
    const report = raw as {
        "violated-directive"?: string;
        "effective-directive"?: string;
        "blocked-uri"?: string;
        "document-uri"?: string;
        "script-sample"?: string;
        // Legacy flat shape aliases.
        violatedDirective?: string;
        effectiveDirective?: string;
        blockedUri?: string;
        documentUri?: string;
        scriptSample?: string;
    };
    const directive = report.violatedDirective ?? report["violated-directive"] ?? report.effectiveDirective ?? report["effective-directive"] ?? "unknown";
    const blocked = report.blockedUri ?? report["blocked-uri"] ?? "unknown";
    const document = report.documentUri ?? report["document-uri"] ?? "unknown";
    const sample = report.scriptSample ?? report["script-sample"];

    // Log a single structured line so log aggregators (Convex logs,
    // Vercel logs, or a future Sentry SDK) can index by directive.
    console.warn(
        JSON.stringify({
            ts: new Date().toISOString(),
            kind: "csp-violation",
            directive,
            blocked,
            document,
            sample: sample?.slice(0, 200),
        }),
    );

    // 204 No Content is the spec-recommended response — the browser
    // doesn't display this and we don't want to leak any data.
    return new NextResponse(null, { status: 204 });
}
