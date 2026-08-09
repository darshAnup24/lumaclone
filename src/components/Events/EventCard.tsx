import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import type { EventRecord } from "@/lib/events/schema";
import {
  categoryLabel,
  eventTypeLabel,
  formatEventDate,
  formatEventLocation,
} from "@/lib/events/presentation";

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/65 dark:hover:border-zinc-700"
    >
      {event.cover_image_url ? (
        <div
          aria-label={`${event.title} cover`}
          className="aspect-[16/9] w-full bg-zinc-200 bg-cover bg-center dark:bg-zinc-800"
          role="img"
          style={{ backgroundImage: `url(${JSON.stringify(event.cover_image_url)})` }}
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-end bg-gradient-to-br from-zinc-100 via-purple-100 to-orange-100 p-4 dark:from-zinc-800 dark:via-purple-950 dark:to-zinc-900">
          <CalendarDays className="size-8 text-zinc-500 dark:text-zinc-400" />
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span>{eventTypeLabel(event)}</span>
          <span aria-hidden="true">·</span>
          <span>{categoryLabel(event.category)}</span>
        </div>
        <div>
          <h2 className="line-clamp-2 font-semibold text-zinc-900 transition group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
            {event.title}
          </h2>
          <p className="mt-1 flex items-start gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <CalendarDays className="mt-0.5 size-4 shrink-0" />
            {formatEventDate(event)}
          </p>
          <p className="mt-1 flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-500">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="line-clamp-1">{formatEventLocation(event)}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
