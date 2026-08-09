import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AdminAuthenticationError,
  AdminAuthorizationError,
  requireAdmin,
} from "@/lib/admin/auth";
import { reviewInboundEvent } from "@/lib/admin/review";
import { adminReviewSchema } from "@/lib/admin/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const eventId = z.string().uuid().parse((await context.params).id);
    const input = adminReviewSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    await requireAdmin(supabase);
    const event = await reviewInboundEvent(supabase, eventId, input);
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof AdminAuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ message: "Check the review fields and try again." }, { status: 400 });
    }
    console.error("Unable to review inbound event", error);
    return NextResponse.json({ message: "The review could not be saved." }, { status: 500 });
  }
}
