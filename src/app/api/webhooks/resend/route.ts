import { NextResponse } from "next/server";
import { persistInboundEmail, receivedEmailEventSchema } from "@/lib/email/inbound";
import { verifyResendWebhook } from "@/lib/email/webhook";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ message: "Webhook is not configured" }, { status: 503 });
  const body = await request.text();
  if (!verifyResendWebhook(body, request.headers, secret)) {
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 401 });
  }
  try {
    const payload = JSON.parse(body) as { type?: string };
    if (payload.type !== "email.received") return NextResponse.json({ received: true });
    const result = await persistInboundEmail(receivedEmailEventSchema.parse(payload));
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("Inbound Resend webhook failed", error);
    return NextResponse.json({ message: "Inbound email could not be stored" }, { status: 500 });
  }
}
