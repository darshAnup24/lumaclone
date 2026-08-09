import type { Metadata } from "next";
import { EventCollection } from "@/components/Events/EventCollection";
import { EventShell } from "@/components/Events/EventShell";
import { loadPublishedEvents } from "@/lib/events/load";
import { filterEvents, parseDiscoveryFilter } from "@/lib/events/presentation";

export const metadata: Metadata = { title: "Discover · LeviClub" };
export const dynamic = "force-dynamic";

type DiscoverPageProps = {
  searchParams: Promise<{ filter?: string | string[] }>;
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const filter = parseDiscoveryFilter((await searchParams).filter);
  const result = await loadPublishedEvents();
  const events = filterEvents(result.events, filter);

  return (
    <EventShell>
      <div className="mb-7">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Around campus</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Discover events
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Official announcements and student-led activities, together in one place.
        </p>
      </div>
      <div className="space-y-5">
        <EventCollection
          {...result}
          activeFilter={filter}
          events={events}
          showFilters
        />
      </div>
    </EventShell>
  );
}
