import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTransactionalEmail } from "@/lib/email/resend";

const email = { to: "student@campus.edu", subject: "Request accepted", text: "You are in." };

describe("isolated Resend delivery", () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("skips safely when server configuration is absent", async () => {
    const fetcher = vi.fn();
    await expect(sendTransactionalEmail(email, fetcher)).resolves.toEqual({
      status: "skipped",
      error: "Resend is not configured",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends only through the server API with bearer authorization", async () => {
    process.env.RESEND_API_KEY = "test-server-key";
    process.env.RESEND_FROM_EMAIL = "Campus <events@campus.test>";
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "mail-1" }) });
    await expect(sendTransactionalEmail(email, fetcher)).resolves.toEqual({ status: "sent", id: "mail-1" });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-server-key" }),
      }),
    );
  });

  it("returns provider and network failures instead of throwing", async () => {
    process.env.RESEND_API_KEY = "test-server-key";
    process.env.RESEND_FROM_EMAIL = "events@campus.test";
    const rejected = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ message: "rate limited" }) });
    await expect(sendTransactionalEmail(email, rejected)).resolves.toEqual({ status: "failed", error: "rate limited" });
    const offline = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(sendTransactionalEmail(email, offline)).resolves.toEqual({ status: "failed", error: "offline" });
  });
});
