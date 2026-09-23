import { NextRequest, NextResponse } from "next/server";

// runtime: node — why: webhook + redirect handler. Default Node is fine
// for both GET (redirect) and POST (webhook payload). Per docs/perf.md §1.

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
        return NextResponse.redirect(new URL("/checkout?error=no_reference", request.url));
    }

    // In production, verify the transaction via Convex action
    // Canonical billing route lives under the dashboard settings shell; going
    // straight there avoids the legacy /settings/billing redirect hop and
    // preserves the `verified` reference on the landing page.
    return NextResponse.redirect(
        new URL(`/dashboard/settings/billing?verified=${reference}`, request.url)
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Paystack sends webhook events here
        // Verify the webhook signature in production
        console.log("Paystack webhook:", body);

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Paystack webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
