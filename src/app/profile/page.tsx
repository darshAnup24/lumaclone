import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Settings2 } from "lucide-react";
import { EventShell } from "@/components/Events/EventShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventRecordSchema } from "@/lib/events/schema";
import { formatEventDate, formatEventLocation } from "@/lib/events/presentation";

export const metadata: Metadata = { title: "Your Profile · LeviClub" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/profile");

  const [{ data: profile }, { data: eventRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email,name,avatar_url,bio")
      .eq("id", user.id)
      .single(),
    supabase
      .from("events")
      .select("*")
      .eq("organizer_user_id", user.id)
      .eq("status", "published")
      .order("start_time", { ascending: true, nullsFirst: false }),
  ]);

  const events = eventRecordSchema.array().safeParse(eventRows ?? []);
  const hostedEvents = events.success ? events.data : [];
  const name =
    profile?.name ??
    user.user_metadata.full_name ??
    user.user_metadata.username ??
    "LeviClub member";
  const username =
    typeof user.user_metadata.username === "string"
      ? user.user_metadata.username
      : null;
  const avatar =
    profile?.avatar_url ??
    (typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null);

  return (
    <EventShell>
      <div className="mx-auto max-w-4xl">
        <section className="flex flex-col gap-6 border-b border-zinc-200 pb-8 dark:border-zinc-800 sm:flex-row sm:items-center">
          {avatar ? (
            <Image
              alt={`${name} profile photo`}
              className="size-28 rounded-full object-cover"
              height={224}
              priority
              src={avatar}
              width={224}
            />
          ) : (
            <div className="size-28 rounded-full bg-gradient-to-tl from-[#F66371] to-[#C0CEF6]" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="truncate text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {name}
                </h1>
                {username ? (
                  <p className="mt-1 text-zinc-500">@{username}</p>
                ) : null}
              </div>
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                href="/settings"
              >
                <Settings2 className="size-4" />
                Edit profile
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
              {profile?.bio || "Share your interests and what you like to organize."}
            </p>
            <p className="mt-3 text-sm text-zinc-500">{profile?.email ?? user.email}</p>
          </div>
        </section>

        <section className="pt-8">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Hosted Events
          </h2>
          {hostedEvents.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {hostedEvents.map((event) => (
                <Link
                  className="rounded-xl border border-zinc-200 bg-white/55 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/65 dark:hover:border-zinc-700"
                  href={`/events/${event.id}`}
                  key={event.id}
                >
                  <p className="font-medium text-zinc-950 dark:text-zinc-100">
                    {event.title}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                    <CalendarDays className="size-4" />
                    {formatEventDate(event)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin className="size-4" />
                    {formatEventLocation(event)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white/55 px-5 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/65">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                You have not published an event yet.
              </p>
              <Link
                className="mt-2 inline-block text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
                href="/create"
              >
                Create your first event
              </Link>
            </div>
          )}
        </section>
      </div>
    </EventShell>
  );
}
