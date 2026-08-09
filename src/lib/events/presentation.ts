import type { EventRecord } from "./schema";

export const discoveryFilters = [
  ["all", "All"],
  ["official", "Official"],
  ["student", "Student"],
  ["hackathon", "Hackathons"],
  ["conference", "Conferences"],
  ["workshop", "Workshops"],
  ["competition", "Competitions"],
  ["club_activity", "Club Activities"],
  ["career_placement", "Career / Placement"],
  ["social", "Social"],
  ["sports", "Sports"],
  ["study", "Study"],
  ["networking", "Networking"],
] as const;

export type DiscoveryFilter = (typeof discoveryFilters)[number][0];

const validFilters = new Set<string>(discoveryFilters.map(([value]) => value));

export function parseDiscoveryFilter(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && validFilters.has(candidate)
    ? (candidate as DiscoveryFilter)
    : "all";
}

export function filterEvents(events: EventRecord[], filter: DiscoveryFilter) {
  if (filter === "all") return events;
  if (filter === "official") {
    return events.filter((event) => event.event_type === "official");
  }
  if (filter === "student") {
    return events.filter((event) => event.event_type === "solo");
  }
  return events.filter((event) => event.category === filter);
}

export function eventDate(event: EventRecord) {
  return event.start_time ?? event.registration_deadline;
}

function safeTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function formatEventDate(event: EventRecord, includeYear = false) {
  const timestamp = eventDate(event);
  if (!timestamp) return "Date to be announced";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: includeYear ? "numeric" : undefined,
    hour: event.start_time ? "numeric" : undefined,
    minute: event.start_time ? "2-digit" : undefined,
    timeZone: safeTimeZone(event.timezone),
  }).format(new Date(timestamp));
}

export function formatEventLocation(event: EventRecord) {
  if (event.location_type === "online") return "Online";
  if (event.location_type === "hybrid") {
    return event.location ? `${event.location} · Hybrid` : "Hybrid";
  }
  return event.location ?? "Location to be announced";
}

export function eventTypeLabel(event: EventRecord) {
  return event.event_type === "official" ? "Official" : "Student activity";
}

export function categoryLabel(category: EventRecord["category"]) {
  if (category === "unknown") return "Campus event";
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function groupEventsByDay(events: EventRecord[]) {
  return events.reduce<Array<{ key: string; label: string; events: EventRecord[] }>>(
    (groups, event) => {
      const timestamp = eventDate(event);
      const key = timestamp ? timestamp.slice(0, 10) : "tbd";
      const existing = groups.find((group) => group.key === key);
      if (existing) {
        existing.events.push(event);
        return groups;
      }
      groups.push({
        key,
        label: timestamp
          ? new Intl.DateTimeFormat("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: safeTimeZone(event.timezone),
            }).format(new Date(timestamp))
          : "Date pending",
        events: [event],
      });
      return groups;
    },
    [],
  );
}
