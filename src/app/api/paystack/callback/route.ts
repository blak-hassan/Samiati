import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
        return NextResponse.redirect(new URL("/checkout?error=no_reference", request.url));
    }

    // In production, verify the transaction via Convex action
    // For now, redirect to billing page
    return NextResponse.redirect(
        new URL(`/settings/billing?verified=${reference}`, request.url)
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
