import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const socialSchema = z.object({
  instagram: z.string().trim().max(100).default(""),
  twitter: z.string().trim().max(100).default(""),
  youtube: z.string().trim().max(100).default(""),
  tiktok: z.string().trim().max(100).default(""),
  linkedin: z.string().trim().max(160).default(""),
});

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores."),
  bio: z.string().trim().max(500).default(""),
  social: socialSchema,
});

async function authenticatedClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,name,avatar_url,bio")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const social = socialSchema.safeParse(user.user_metadata.social);

  return NextResponse.json({
    ...profile,
    username:
      typeof user.user_metadata.username === "string"
        ? user.user_metadata.username
        : "",
    social: social.success
      ? social.data
      : socialSchema.parse({}),
  });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const parsed = profileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid profile." },
      { status: 400 },
    );
  }

  const { name, username, bio, social } = parsed.data;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name, bio: bio || null })
    .eq("id", user.id);
  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 500 });
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: name,
      username,
      bio,
      social,
    },
  });
  if (authError) {
    return NextResponse.json({ message: authError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
