import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createStudentEvent } from "@/lib/events/repository";
import { studentEventInputSchema } from "@/lib/events/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const input = studentEventInputSchema.parse({
      ...body,
      status: "published",
    });
    const event = await createStudentEvent(supabase, user.id, input);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json(
        { message: "Check the activity details and try again." },
        { status: 400 },
      );
    }
    console.error("Unable to create student activity", error);
    return NextResponse.json(
      { message: "The activity could not be created. Please try again." },
      { status: 500 },
    );
  }
}
