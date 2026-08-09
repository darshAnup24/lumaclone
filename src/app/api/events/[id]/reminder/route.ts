import { NextResponse } from "next/server";
import { z } from "zod";
import { emailAcceptedParticipants } from "@/lib/email/notifications";
import { getEvent } from "@/lib/events/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const eventId = z.string().uuid().parse((await context.params).id);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const event = await getEvent(supabase, eventId);
    if (!event || event.status !== "published") {
      return NextResponse.json({ message: "Published event not found" }, { status: 404 });
    }
    const { data: recipientCount, error: reminderError } = await supabase.rpc(
      "create_event_reminder",
      { target_event_id: eventId },
    );
    if (reminderError) throw reminderError;

    await emailAcceptedParticipants(
      eventId,
      "event_reminder",
      "Event reminder",
      `${event.title} is coming up soon.`,
    );
    return NextResponse.json({ recipientCount: recipientCount ?? 0 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid event." }, { status: 400 });
    }
    console.error("Unable to create event reminder", error);
    return NextResponse.json(
      { message: "The reminder could not be sent. Please try again." },
      { status: 500 },
    );
  }
}
