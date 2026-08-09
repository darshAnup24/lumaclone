import { NextResponse } from "next/server";
import { z } from "zod";
import { emailAcceptedParticipants } from "@/lib/email/notifications";
import { updateOwnedStudentEvent } from "@/lib/events/repository";
import { studentEventUpdateSchema } from "@/lib/events/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

const attendeeVisibleFields = new Set([
  "title",
  "description",
  "start_time",
  "end_time",
  "timezone",
  "location_type",
  "location",
  "meeting_url",
]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const eventId = z.string().uuid().parse((await context.params).id);
    const update = studentEventUpdateSchema.parse(await request.json());
    if (!Object.keys(update).length) {
      return NextResponse.json({ message: "No event changes supplied." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const event = await updateOwnedStudentEvent(supabase, user.id, eventId, update);
    if (Object.keys(update).some((field) => attendeeVisibleFields.has(field))) {
      await emailAcceptedParticipants(
        event.id,
        "event_updated",
        "Event updated",
        `${event.title} has updated details.`,
      );
    }
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid event changes." }, { status: 400 });
    }
    console.error("Unable to update student event", error);
    return NextResponse.json(
      { message: "The event could not be updated. Please try again." },
      { status: 500 },
    );
  }
}
