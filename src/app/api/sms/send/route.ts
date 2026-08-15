import { NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MAX_SMS_LENGTH = 1600;

interface SearchOutcome {
  answer: string;
  followUps: string[];
}

async function runSearch(query: string, language: string): Promise<SearchOutcome> {
  if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }

  const response = await fetch(`${CONVEX_URL}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "gemini:search",
      args: { query, language, links: [], document: "" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Search failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (result.status === "error") {
    throw new Error(result.errorMessage || "Search action failed");
  }

  const value = result.value ?? {};
  return {
    answer: typeof value.answer === "string" ? value.answer : "",
    followUps: Array.isArray(value.followUps) ? value.followUps : [],
  };
}

async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    throw new Error("Twilio is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).");
  }

  const auth = "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Twilio error ${response.status}: ${errorText}`);
  }
}

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
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");

  let to = "";
  let query = "";
  let language = "English";

  if (isForm) {
    const form = await request.formData();
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

  try {
    const outcome = await runSearch(query, language);
    const trimmed = truncateForSms(outcome.answer || "Sorry, I could not find an answer for that question.");

    if (isForm && to) {
      return twimlReply(trimmed);
    }

    if (!to) {
      return NextResponse.json({ error: "A recipient (to / From) is required to send SMS." }, { status: 400 });
    }

    await sendSms(to, trimmed);

    return NextResponse.json({
      ok: true,
      to,
      length: trimmed.length,
      followUps: outcome.followUps.slice(0, 2),
    });
  } catch (error) {
    console.error("[SMS send] failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (isForm && to) {
      return twimlReply(`Samiati: ${message}`);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "samiati-sms",
    status: "ok",
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
  });
}