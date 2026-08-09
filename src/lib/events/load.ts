import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getEvent, listPublishedEvents } from "./repository";
import type { EventRecord } from "./schema";

export type EventLoadResult = {
  events: EventRecord[];
  configured: boolean;
  unavailable: boolean;
};

export async function loadPublishedEvents(): Promise<EventLoadResult> {
  if (!isSupabaseConfigured()) {
    return { events: [], configured: false, unavailable: false };
  }

  try {
    const client = await createSupabaseServerClient();
    return {
      events: await listPublishedEvents(client),
      configured: true,
      unavailable: false,
    };
  } catch (error) {
    console.error("Unable to load published events", error);
    return { events: [], configured: true, unavailable: true };
  }
}

export async function loadPublishedEvent(id: string) {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = await createSupabaseServerClient();
    const event = await getEvent(client, id);
    return event?.status === "published" ? event : null;
  } catch (error) {
    console.error("Unable to load published event", error);
    return null;
  }
}
