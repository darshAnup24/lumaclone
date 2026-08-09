import type { Metadata } from "next";
import { DiscoverExperience } from "@/components/Events/DiscoverExperience";
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
      <DiscoverExperience
        {...result}
        activeFilter={filter}
        allEvents={result.events}
        events={events}
      />
    </EventShell>
  );
}
