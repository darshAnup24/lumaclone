import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCollection } from "@/components/Events/EventCollection";
import { EventShell } from "@/components/Events/EventShell";
import { loadPublishedEvents } from "@/lib/events/load";

export const metadata: Metadata = { title: "Home · Luma" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await loadPublishedEvents();
  const upcoming = result.events.slice(0, 6);

  return (
    <EventShell>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Your campus</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Upcoming events
          </h1>
        </div>
        <Link
          href="/discover"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Discover all <ArrowRight className="size-4" />
        </Link>
      </div>
      <EventCollection {...result} events={upcoming} />
    </EventShell>
  );
}
