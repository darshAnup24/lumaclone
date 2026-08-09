import { NextResponse } from "next/server";
import { z } from "zod";
import { getEvent } from "@/lib/events/repository";
import {
  cancelOwnJoinRequest,
  createJoinRequest,
  EventRequestDatabaseError,
  getOwnEventRequest,
  listEventRequests,
} from "@/lib/events/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailOrganizerOfNewRequest } from "@/lib/email/notifications";

type RouteContext = { params: Promise<{ id: string }> };

async function context(requestContext: RouteContext) {
  const eventId = z.string().uuid().parse((await requestContext.params).id);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { eventId, supabase, user: error ? null : user };
}

function requestError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ message: "Invalid activity." }, { status: 400 });
  }
  if (error instanceof EventRequestDatabaseError) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "You have already requested to join this activity." },
        { status: 409 },
      );
    }
    if (error.code === "42501") {
      return NextResponse.json({ message: "This request is not allowed." }, { status: 403 });
    }
  }
  console.error("Event request operation failed", error);
  return NextResponse.json(
    { message: "The request could not be completed. Please try again." },
    { status: 500 },
  );
}

export async function GET(_request: Request, requestContext: RouteContext) {
  try {
    const { eventId, supabase, user } = await context(requestContext);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    const event = await getEvent(supabase, eventId);
    if (!event || event.event_type !== "solo" || event.status !== "published") {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    const isOrganizer = event.organizer_user_id === user.id;
    if (isOrganizer) {
      const requests = await listEventRequests(supabase, eventId);
      return NextResponse.json({
        isOrganizer,
        request: null,
        requests,
        acceptedCount: requests.filter((item) => item.status === "accepted").length,
      });
    }
    return NextResponse.json({
      isOrganizer,
      request: await getOwnEventRequest(supabase, user.id, eventId),
      requests: [],
      acceptedCount: null,
    });
  } catch (error) {
    return requestError(error);
  }
}

export async function POST(_request: Request, requestContext: RouteContext) {
  try {
    const { eventId, supabase, user } = await context(requestContext);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    const request = await createJoinRequest(supabase, user.id, eventId);
    await emailOrganizerOfNewRequest(eventId);
    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    return requestError(error);
  }
}

export async function DELETE(_request: Request, requestContext: RouteContext) {
  try {
    const { eventId, supabase, user } = await context(requestContext);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    const request = await cancelOwnJoinRequest(supabase, user.id, eventId);
    return NextResponse.json({ request });
  } catch (error) {
    return requestError(error);
  }
}
