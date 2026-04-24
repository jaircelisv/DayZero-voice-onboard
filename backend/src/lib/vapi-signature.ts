import { Request } from "express";

// Vapi sends a shared secret header on every Server URL request.
// Header name is configurable in dashboard; default we use is `x-vapi-secret`.
// Docs: https://docs.vapi.ai/server-url#authentication

export function validateVapiSignature(req: Request): boolean {
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (!expected) {
    // In dev we allow unsigned calls so cloudflared + browser testing works.
    return process.env.NODE_ENV !== "production";
  }
  const got =
    (req.headers["x-vapi-secret"] as string | undefined) ??
    (req.headers["x-vapi-signature"] as string | undefined);
  if (!got) return false;
  return timingSafeEqual(got, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
