import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { isValidTwilioSignature } from "@/lib/smsSignature";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SMS_WEBHOOK_SECRET = process.env.SMS_WEBHOOK_SECRET;
const MAX_SMS_LENGTH = 1600;
const MAX_QUERY_LENGTH = 5000;

function truncateForSms(answer: string): string {
  if (answer.length <= MAX_SMS_LENGTH) return answer;
  return answer.slice(0, MAX_SMS_LENGTH) + "...";
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function twimlReply(body: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=UTF-8" },
  });
}

export async function POST(request: Request) {
  // The SMS pipeline is server-to-server only. Refuse to run without the
  // shared secret configured server-side.
  if (!SMS_WEBHOOK_SECRET || !CONVEX_URL) {
    return NextResponse.json({ error: "SMS service is not configured." }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let to = "";
  let query = "";
  let language = "English";
  const formParams = new URLSearchParams();

  if (isForm) {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      formParams.set(key, String(value));
    }
    to = String(form.get("From") ?? form.get("to") ?? form.get("To") ?? "").trim();
    query = String(form.get("Body") ?? form.get("query") ?? form.get("message") ?? "").trim();
    const lang = form.get("language");
    if (lang) language = String(lang);
  } else {
    const body = await request.json().catch(() => ({}));
    to = String(body.to ?? "").trim();
    query = String(body.query ?? body.message ?? "").trim();
    if (body.language) language = String(body.language);
  }

  if (!query) {
    return NextResponse.json({ error: "query (or Body) is required." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is too long." }, { status: 400 });
  }
  if (!/^\+?[0-9]{6,15}$/.test(to)) {
    return NextResponse.json({ error: "Invalid recipient phone number." }, { status: 400 });
  }

  // Twilio webhook requests carry X-Twilio-Signature; JSON calls must present
  // the shared webhook secret. Either one proves the caller is trusted.
  const twilioSignature = request.headers.get("x-twilio-signature");
  const bearerSecret = request.headers.get("x-samiati-secret");
  const signatureValid =
    (isForm && isValidTwilioSignature(request.url, formParams, twilioSignature, TWILIO_AUTH_TOKEN)) ||
    (bearerSecret !== null && bearerSecret === SMS_WEBHOOK_SECRET);
  if (!signatureValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convex = new ConvexHttpClient(CONVEX_URL);
  let outcome: { answer: string; followUps: string[] };
  try {
    const result = await convex.action(api.sms.processSmsSearch, {
      secret: SMS_WEBHOOK_SECRET,
      phoneNumber: to,
      query,
      language,
    });
    outcome = {
      answer: result.answer ?? "Sorry, I could not find an answer for that question.",
      followUps: result.followUps ?? [],
    };
  } catch (error) {
    console.error("[SMS send] failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (isForm) {
      return twimlReply(`Samiati: ${message}`);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const trimmed = truncateForSms(outcome.answer || "Sorry, I could not find an answer for that question.");

  if (isForm) {
    return twimlReply(trimmed);
  }

  if (!TWILIO_AUTH_TOKEN || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_FROM_NUMBER) {
    return NextResponse.json({ error: "Twilio is not configured." }, { status: 503 });
  }

  const auth = "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER!, Body: trimmed });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    return NextResponse.json({ error: `Twilio error ${response.status}: ${errorText}` }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    to,
    length: trimmed.length,
    followUps: outcome.followUps.slice(0, 2),
  });
}