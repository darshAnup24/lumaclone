import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const receivedEmailEventSchema = z.object({
  type: z.literal("email.received"),
  created_at: z.string().datetime({ offset: true }),
  data: z.object({
    email_id: z.string().min(1), message_id: z.string().min(1).optional(),
    from: z.string().min(1), to: z.array(z.string().min(1)).min(1),
    subject: z.string().default(""), attachments: z.array(z.unknown()).default([]),
  }),
});
export type ReceivedEmailEvent = z.infer<typeof receivedEmailEventSchema>;

export function parseMailbox(value: string) {
  const angle = value.match(/^\s*(.*?)\s*<([^<>]+)>\s*$/);
  const parsed = z.string().email().safeParse((angle?.[2] ?? value).trim().toLowerCase());
  if (!parsed.success) throw new Error("Invalid sender email address");
  return { email: parsed.data, displayName: angle?.[1]?.replace(/^['"]|['"]$/g, "").trim() || null };
}

export async function persistInboundEmail(event: ReceivedEmailEvent, fetcher: typeof fetch = fetch) {
  const admin = createSupabaseAdminClient();
  const sender = parseMailbox(event.data.from);
  const recipient = parseMailbox(event.data.to[0]).email;
  let textBody: string | null = null, htmlBody: string | null = null;
  let status: "received" | "needs_review" | "failed" = "received";
  let errorMessage: string | null = null;
  try {
    const response = await fetcher(`https://api.resend.com/emails/receiving/${event.data.email_id}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}` },
    });
    if (!response.ok) throw new Error(`Resend content fetch returned ${response.status}`);
    const content = (await response.json()) as { text?: string | null; html?: string | null };
    textBody = content.text ?? null; htmlBody = content.html ?? null;
  } catch (error) {
    status = "failed";
    errorMessage = error instanceof Error ? error.message : "Unable to fetch email content";
  }
  const { data: organizations, error: organizationError } = await admin
    .from("organizations").select("id,email_patterns").eq("is_verified", true).eq("is_official", true);
  if (organizationError) throw organizationError;
  const organization = (organizations ?? []).find((item) =>
    (item.email_patterns ?? []).some((pattern: string) => pattern.trim().toLowerCase() === sender.email));
  if (status !== "failed" && !organization) status = "needs_review";
  const { error } = await admin.from("inbound_emails").upsert({
    message_id: event.data.message_id ?? event.data.email_id,
    from_email: sender.email, from_name: sender.displayName, to_email: recipient,
    subject: event.data.subject, text_body: textBody, html_body: htmlBody,
    received_at: event.created_at, processing_status: status,
    attachment_metadata: event.data.attachments, error_message: errorMessage,
    organization_id: organization?.id ?? null,
  }, { onConflict: "message_id", ignoreDuplicates: true });
  if (error) throw error;
  return { status, matchedOrganization: Boolean(organization) };
}
