import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { EventShell } from "@/components/Events/EventShell";
import { loadPublishedEvents } from "@/lib/events/load";
import {
  formatEventLocation,
  groupEventsByDay,
} from "@/lib/events/presentation";

export const metadata: Metadata = { title: "Calendar · LeviClub" };
export const dynamic = "force-dynamic";

export default async function CalendarsPage() {
  const result = await loadPublishedEvents();
  const groups = groupEventsByDay(result.events);

  return (
    <EventShell>
      <div className="mb-7">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Campus schedule</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Calendar
        </h1>
      </div>

      {groups.length ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/65 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/65">
          {groups.map((group) => (
            <section
              className="grid border-b border-zinc-200/80 last:border-b-0 dark:border-zinc-800 sm:grid-cols-[11rem_1fr]"
              key={group.key}
            >
              <h2 className="border-b border-zinc-200/80 px-5 py-4 text-sm font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:border-b-0 sm:border-r">
                {group.label}
              </h2>
              <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {group.events.map((event) => (
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-start gap-4 px-5 py-4 transition hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                    key={event.id}
                  >
                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-zinc-400" />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                        {event.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-zinc-500">
                        <MapPin className="size-3.5 shrink-0" />
                        {formatEventLocation(event)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200/80 bg-white/60 px-6 py-14 text-center backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">Your calendar is clear</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
            {result.unavailable
              ? "Events are temporarily unavailable. Please try again shortly."
              : result.configured
                ? "Published campus events will appear here."
                : "Connect the cloud Supabase project to show published campus events."}
          </p>
        </div>
      )}
    </EventShell>
  );
}
