import type { EventRecord } from "./schema";

export const categoryCoverImages: Record<EventRecord["category"], string> = {
  hackathon: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  workshop: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  seminar: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2",
  competition: "https://images.unsplash.com/photo-1511994298241-608e28f14fde",
  club_activity: "https://images.unsplash.com/photo-1531482615713-2afd69097998",
  career_placement: "https://images.unsplash.com/photo-1521737711867-e3b97375f902",
  social: "https://images.unsplash.com/photo-1511632765486-a01980e01a18",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211",
  study: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8",
  networking: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
  cultural: "https://images.unsplash.com/photo-1503095396549-807759245b35",
  other: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe",
  unknown: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe",
};

export function eventCoverUrl(
  event: Pick<EventRecord, "category" | "cover_image_url">,
) {
  return event.cover_image_url ?? categoryCoverImages[event.category];
}
