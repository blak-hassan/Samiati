import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies the X-Twilio-Signature header per Twilio's webhook validation
 * spec: HMAC-SHA1 over the full request URL (including query string) plus
 * each POST body parameter sorted by key.
 */
export function isValidTwilioSignature(
  url: string,
  params: URLSearchParams,
  signature: string | null,
  authToken: string | undefined,
): boolean {
  if (!signature || !authToken) return false;
  const entries = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const body = entries.map(([k, v]) => `${k}${v}`).join("");
  const expected = createHmac("sha1", authToken).update(url + body).digest("base64");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  return (
    expectedBuf.length === signatureBuf.length &&
    timingSafeEqual(expectedBuf, signatureBuf)
  );
}