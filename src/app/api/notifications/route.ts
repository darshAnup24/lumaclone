import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function authenticatedClient() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  return { client, user: error ? null : user };
}

export async function GET() {
  try {
    const { client, user } = await authenticatedClient();
    if (!user) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    const { data, error } = await client
      .from("notifications")
      .select("id,event_id,type,title,message,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    console.error("Unable to load notifications", error);
    return NextResponse.json({ message: "Notifications are unavailable." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const input = z.object({ id: z.string().uuid().optional() }).parse(await request.json());
    const { client, user } = await authenticatedClient();
    if (!user) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    let query = client.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    if (input.id) query = query.eq("id", input.id);
    const { error } = await query.select("id");
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid notification." }, { status: 400 });
    }
    console.error("Unable to mark notifications read", error);
    return NextResponse.json({ message: "The notification could not be updated." }, { status: 500 });
  }
}
