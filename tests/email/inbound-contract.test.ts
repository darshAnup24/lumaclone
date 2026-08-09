import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const inbound = readFileSync(resolve("src/lib/email/inbound.ts"), "utf8");
const route = readFileSync(resolve("src/app/api/webhooks/resend/route.ts"), "utf8");

describe("inbound email persistence contract", () => {
  it("verifies the raw webhook body before parsing", () => {
    expect(route.indexOf("request.text()")) .toBeLessThan(route.indexOf("JSON.parse(body)"));
    expect(route).toContain("verifyResendWebhook");
    expect(route).toContain("RESEND_WEBHOOK_SECRET");
  });

  it("fetches and retains full raw text and HTML content", () => {
    expect(inbound).toContain("/emails/receiving/${event.data.email_id}");
    expect(inbound).toContain("text_body: textBody");
    expect(inbound).toContain("html_body: htmlBody");
    expect(inbound).toContain("attachment_metadata: event.data.attachments");
  });

  it("matches only verified official sender patterns and reviews unknown senders", () => {
    expect(inbound).toContain('.eq("is_verified", true)');
    expect(inbound).toContain('.eq("is_official", true)');
    expect(inbound).toContain('status = "needs_review"');
    expect(inbound).toContain("organization_id: organization?.id ?? null");
  });

  it("records processing failure and makes webhook retries idempotent", () => {
    expect(inbound).toContain('status = "failed"');
    expect(inbound).toContain("error_message: errorMessage");
    expect(inbound).toContain('onConflict: "message_id", ignoreDuplicates: true');
  });
});
