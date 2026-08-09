import "server-only";

export type TransactionalEmail = { to: string; subject: string; text: string };
export type EmailDelivery = { status: "sent" | "failed" | "skipped"; id?: string; error?: string };

export async function sendTransactionalEmail(
  email: TransactionalEmail,
  fetcher: typeof fetch = fetch,
): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { status: "skipped", error: "Resend is not configured" };
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...email }),
    });
    const result = (await response.json()) as { id?: string; message?: string };
    return response.ok
      ? { status: "sent", id: result.id }
      : { status: "failed", error: result.message ?? `Resend returned ${response.status}` };
  } catch (error) {
    return { status: "failed", error: error instanceof Error ? error.message : "Unknown email error" };
  }
}
