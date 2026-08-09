import { NextResponse } from "next/server";
import { z } from "zod";
import {
  EventRequestDatabaseError,
  respondToJoinRequest,
} from "@/lib/events/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailParticipantOfDecision } from "@/lib/email/notifications";

const decisionSchema = z.object({
  decision: z.enum(["accepted", "rejected"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const requestId = z.string().uuid().parse((await context.params).id);
    const decision = decisionSchema.parse(await request.json()).decision;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const eventRequest = await respondToJoinRequest(supabase, requestId, decision);
    await emailParticipantOfDecision(
      eventRequest.user_id,
      eventRequest.event_id,
      decision === "accepted",
    );
    return NextResponse.json({ request: eventRequest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid request decision." }, { status: 400 });
    }
    if (error instanceof EventRequestDatabaseError) {
      const message = error.message.toLowerCase();
      if (error.code === "42501" || message.includes("only the organizer")) {
        return NextResponse.json({ message: "Only the organizer can respond." }, { status: 403 });
      }
      if (message.includes("capacity reached")) {
        return NextResponse.json({ message: "Activity capacity has been reached." }, { status: 409 });
      }
      if (message.includes("pending request not found")) {
        return NextResponse.json({ message: "This request is no longer pending." }, { status: 409 });
      }
    }
    console.error("Unable to respond to event request", error);
    return NextResponse.json(
      { message: "The decision could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
