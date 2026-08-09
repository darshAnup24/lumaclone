import { expect, it } from "vitest";
import { extractEventWithGroq } from "@/lib/ai/groq";

const liveIt = process.env.LIVE_AI_VALIDATION === "1" ? it : it.skip;

liveIt("validates a live Groq structured extraction", async () => {
  const result = await extractEventWithGroq({
    subject: "24 Hour Hackathon Registrations Open",
    text: "Coding Club hosts a 24 hour hackathon from 9:00 AM on 5 September 2026 to 9:00 AM on 6 September 2026 at the Innovation Centre. Registration closes 1 September 2026 at 8 PM.",
    html: null,
    receivedAt: "2026-08-09T10:00:00+05:30",
  });
  expect(result.is_relevant).toBe(true);
  expect(result.content_type).toBe("event");
  expect(result.category).toBe("hackathon");
  expect(result.timezone).toBe("Asia/Kolkata");
  expect(result.start_time).toContain("2026-09-05");
});
