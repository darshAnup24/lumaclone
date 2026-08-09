import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseMailbox } from "@/lib/email/inbound";
import { verifyResendWebhook } from "@/lib/email/webhook";

const secret = `whsec_${Buffer.from("webhook-test-secret").toString("base64")}`;
const body = JSON.stringify({ type: "email.received" });
const timestamp = "1786250000";
const id = "msg_test";

function signedHeaders(payload = body) {
  const signature = createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${id}.${timestamp}.${payload}`).digest("base64");
  return new Headers({ "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` });
}

describe("Resend inbound webhook security", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("accepts an authentic fresh signature and rejects tampering/replay", () => {
    const now = Number(timestamp) * 1000;
    expect(verifyResendWebhook(body, signedHeaders(), secret, now)).toBe(true);
    expect(verifyResendWebhook(`${body} `, signedHeaders(), secret, now)).toBe(false);
    expect(verifyResendWebhook(body, signedHeaders(), secret, now + 301_000)).toBe(false);
  });

  it("parses the address independently of untrusted sender display names", () => {
    expect(parseMailbox('"Coding Club" <Club@Campus.edu>')).toEqual({
      email: "club@campus.edu",
      displayName: "Coding Club",
    });
    expect(() => parseMailbox("not-an-email")).toThrow("Invalid sender email address");
  });
});
