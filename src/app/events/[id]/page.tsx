import type { Metadata } from "next";
import { CalendarDays, ExternalLink, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { EventShell } from "@/components/Events/EventShell";
import { JoinRequestPanel } from "@/components/Events/JoinRequestPanel";
import { eventCoverUrl } from "@/lib/events/cover";
import { loadPublishedEvent } from "@/lib/events/load";
import {
  categoryLabel,
  eventTypeLabel,
  formatEventDate,
  formatEventLocation,
} from "@/lib/events/presentation";

type EventPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await loadPublishedEvent((await params).id);
  return { title: event ? `${event.title} · LeviClub` : "Event · LeviClub" };
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await loadPublishedEvent((await params).id);
  if (!event) notFound();

  return (
    <EventShell>
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
        <div
          aria-label={`${event.title} cover`}
          className="aspect-[2/1] w-full bg-zinc-200 bg-cover bg-center dark:bg-zinc-800"
          role="img"
          style={{
            backgroundImage: `url(${JSON.stringify(eventCoverUrl(event))})`,
          }}
        />

        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_17rem]">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {eventTypeLabel(event)} · {categoryLabel(event.category)}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              {event.title}
            </h1>
            {event.description ? (
              <p className="mt-7 whitespace-pre-wrap text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
                {event.description}
              </p>
            ) : null}
          </div>

          <aside className="space-y-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
            <Detail icon={<CalendarDays />} label="Date" value={formatEventDate(event, true)} />
            <Detail icon={<MapPin />} label="Location" value={formatEventLocation(event)} />
            {event.capacity ? (
              <Detail icon={<Users />} label="Capacity" value={`${event.capacity} people`} />
            ) : null}
            {event.registration_url ? (
              <a
                href={event.registration_url}
                rel="noreferrer"
                target="_blank"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Register <ExternalLink className="size-4" />
              </a>
            ) : null}
            {event.event_type === "solo" ? (
              <JoinRequestPanel capacity={event.capacity} eventId={event.id} />
            ) : null}
          </aside>
        </div>
      </article>
    </EventShell>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-zinc-400 [&>svg]:size-4">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">{value}</p>
      </div>
    </div>
  );
}
