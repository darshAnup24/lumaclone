import {
  BriefcaseBusiness,
  CalendarDays,
  Dumbbell,
  GraduationCap,
  Handshake,
  Landmark,
  MapPin,
  MicVocal,
  Network,
  Palette,
  Presentation,
  Trophy,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { categoryCoverImages, eventCoverUrl } from "@/lib/events/cover";
import { EventCard } from "./EventCard";
import type { EventRecord } from "@/lib/events/schema";
import {
  discoveryFilters,
  type DiscoveryFilter,
  formatEventDate,
  formatEventLocation,
} from "@/lib/events/presentation";

type EventCategory = EventRecord["category"];

type DiscoverExperienceProps = {
  events: EventRecord[];
  allEvents: EventRecord[];
  activeFilter: DiscoveryFilter;
  configured: boolean;
  unavailable: boolean;
};

const categoryIcons: Partial<Record<EventCategory, LucideIcon>> = {
  hackathon: Network,
  conference: MicVocal,
  workshop: Wrench,
  seminar: Presentation,
  competition: Trophy,
  club_activity: Users,
  career_placement: BriefcaseBusiness,
  social: Handshake,
  sports: Dumbbell,
  study: GraduationCap,
  networking: Network,
  cultural: Palette,
  other: Landmark,
};

const categoryFilters = discoveryFilters.filter(
  ([value]) => !["all", "official", "student"].includes(value),
) as ReadonlyArray<readonly [EventCategory, string]>;

export function DiscoverExperience({
  events,
  allEvents,
  activeFilter,
  configured,
  unavailable,
}: DiscoverExperienceProps) {
  const popularEvents = events.slice(0, 6);
  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.published_at ?? b.created_at).getTime() -
        new Date(a.published_at ?? a.created_at).getTime(),
    )
    .slice(0, 6);
  const activeLabel =
    discoveryFilters.find(([value]) => value === activeFilter)?.[1] ?? "Popular";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Discover Events
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-6 text-zinc-600 dark:text-zinc-400">
          Explore popular events near you, browse by category, or discover what
          the campus community is organizing.
        </p>
      </header>

      <section aria-labelledby="popular-events">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold text-zinc-950 dark:text-zinc-50"
              id="popular-events"
            >
              {activeFilter === "all" ? "Popular Events" : activeLabel}
            </h2>
            <p className="mt-0.5 text-lg text-zinc-500">Bengaluru</p>
          </div>
          {activeFilter !== "all" ? (
            <Link
              className="rounded-lg bg-zinc-200/80 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              href="/discover"
            >
              View All →
            </Link>
          ) : null}
        </div>

        {popularEvents.length ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
            {popularEvents.map((event) => (
              <CompactEvent event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <DiscoverEmptyState
            configured={configured}
            unavailable={unavailable}
          />
        )}
      </section>

      <section
        aria-labelledby="newly-added-events"
        className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800"
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold text-zinc-950 dark:text-zinc-50"
              id="newly-added-events"
            >
              Newly Added
            </h2>
            <p className="mt-0.5 text-lg text-zinc-500">
              The latest campus events, published from email and organizers
            </p>
          </div>
        </div>

        {recentEvents.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentEvents.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No new events yet. Check back soon.
          </p>
        )}
      </section>

      <section
        aria-labelledby="browse-categories"
        className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800"
      >
        <h2
          className="mb-4 text-xl font-semibold text-zinc-950 dark:text-zinc-50"
          id="browse-categories"
        >
          Browse by Category
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryFilters.map(([category, label]) => {
            const matching = allEvents.filter(
              (event) => event.category === category,
            );
            const image =
              matching.find((event) => event.cover_image_url)?.cover_image_url ??
              categoryCoverImages[category];
            const Icon = categoryIcons[category] ?? CalendarDays;
            const isActive = activeFilter === category;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-16 items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 transition ${
                  isActive
                    ? "border-zinc-500 bg-zinc-200 dark:border-zinc-500 dark:bg-zinc-800"
                    : "border-zinc-200 bg-white/55 hover:border-zinc-400 hover:bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/65 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                }`}
                href={`/discover?filter=${category}`}
                key={category}
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-200 bg-cover bg-center dark:bg-zinc-800"
                  style={
                    image
                      ? {
                          backgroundImage: `linear-gradient(rgb(0 0 0 / 25%), rgb(0 0 0 / 25%)), url(${JSON.stringify(image)})`,
                        }
                      : undefined
                  }
                >
                  <Icon
                    className={`size-5 ${
                      image
                        ? "text-white drop-shadow"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {label}
                  </span>
                  <span className="block text-sm text-zinc-500">
                    {matching.length} {matching.length === 1 ? "event" : "events"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CompactEvent({ event }: { event: EventRecord }) {
  return (
    <Link
      className="group grid min-w-0 grid-cols-[4.5rem_1fr] gap-3 rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-500"
      href={`/events/${event.id}`}
    >
      <span
        aria-label={`${event.title} cover`}
        className="flex aspect-square size-[4.5rem] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-950 via-zinc-800 to-orange-950 bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url(${JSON.stringify(eventCoverUrl(event))})`,
        }}
      ></span>
      <span className="min-w-0 py-0.5">
        <span className="block truncate text-sm text-zinc-500">
          {formatEventDate(event)}
        </span>
        <span className="mt-0.5 line-clamp-2 block font-medium leading-5 text-zinc-950 transition group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
          {event.title}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1 text-sm text-zinc-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{formatEventLocation(event)}</span>
        </span>
      </span>
    </Link>
  );
}

function DiscoverEmptyState({
  configured,
  unavailable,
}: {
  configured: boolean;
  unavailable: boolean;
}) {
  const message = unavailable
    ? "Events are temporarily unavailable. Please try again shortly."
    : configured
      ? "No published events match this category yet."
      : "Connect the cloud Supabase project to show published campus events.";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/55 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/65">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
        Nothing scheduled here yet
      </p>
      <p className="mt-1 text-sm text-zinc-500">{message}</p>
    </div>
  );
}
