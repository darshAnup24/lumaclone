import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyResendWebhook(body: string, headers: Headers, secret: string, now = Date.now()) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures || !secret.startsWith("whsec_")) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Math.floor(now / 1000) - seconds) > 300) return false;
  const expected = createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(" ").some((candidate) => {
    const [version, encoded] = candidate.split(",");
    if (version !== "v1" || !encoded) return false;
    const actual = Buffer.from(encoded, "base64");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}
