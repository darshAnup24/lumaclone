import Link from "next/link";
import type { EventRecord } from "@/lib/events/schema";
import {
  discoveryFilters,
  type DiscoveryFilter,
} from "@/lib/events/presentation";
import { EventCard } from "./EventCard";

type EventCollectionProps = {
  events: EventRecord[];
  configured: boolean;
  unavailable: boolean;
  activeFilter?: DiscoveryFilter;
  showFilters?: boolean;
};

export function EventCollection({
  events,
  configured,
  unavailable,
  activeFilter = "all",
  showFilters = false,
}: EventCollectionProps) {
  return (
    <>
      {showFilters ? (
        <nav aria-label="Event filters" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {discoveryFilters.map(([value, label]) => (
            <Link
              href={value === "all" ? "/discover" : `/discover?filter=${value}`}
              key={value}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                activeFilter === value
                  ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white/50 text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

      {events.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200/80 bg-white/60 px-6 py-14 text-center backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60">
          <CalendarEmptyState configured={configured} unavailable={unavailable} />
        </div>
      )}
    </>
  );
}

function CalendarEmptyState({
  configured,
  unavailable,
}: Pick<EventCollectionProps, "configured" | "unavailable">) {
  const message = unavailable
    ? "Events are temporarily unavailable. Please try again shortly."
    : configured
      ? "No published events match this view yet."
      : "Connect the cloud Supabase project to show published campus events.";
  return (
    <>
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">Nothing scheduled here yet</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">{message}</p>
    </>
  );
}
