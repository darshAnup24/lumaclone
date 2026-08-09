import { afterEach, describe, expect, it, vi } from "vitest";
import { extractionPublicationStatus, normalizeExtraction } from "@/lib/ai/extraction";
import { extractEventWithOpenAI } from "@/lib/ai/openai";
import { extractEventWithGroq } from "@/lib/ai/groq";

const base = {
  is_relevant: true, content_type: "event", title: "DSA Workshop", description: "Graph practice",
  organizer: "Coding Club", category: "workshop", start_time: "2026-08-14T17:00:00+05:30",
  end_time: "2026-08-14T19:00:00+05:30", timezone: "Asia/Kolkata", location_type: "physical",
  location: "Seminar Hall", meeting_url: null, registration_url: null, registration_deadline: null,
  capacity: 60, confidence: 0.91, date_ambiguous: false, ambiguity_reason: null,
};

describe("strict campus email extraction", () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_MODEL;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
  });

  it("uses Groq strict JSON-schema chat completions", async () => {
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_MODEL = "openai/gpt-oss-120b";
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(base) } }] }),
    });
    const result = await extractEventWithGroq(
      { subject: base.title, text: base.description, html: null, receivedAt: "2026-08-09T10:00:00+05:30" },
      fetcher,
    );
    expect(result.category).toBe("workshop");
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.any(Object),
    );
    const request = JSON.parse(fetcher.mock.calls[0][1].body as string);
    expect(request.model).toBe("openai/gpt-oss-120b");
    expect(request.response_format.json_schema.strict).toBe(true);
  });

  it.each([
    ["24 Hour Hackathon Registrations Open", "event", "hackathon"],
    ["DSA Workshop this Friday", "event", "workshop"],
    ["Microsoft Campus Recruitment", "opportunity", "career_placement"],
    ["Research Conference", "event", "conference"],
  ])("validates fixture %s as %s/%s", async (subject, contentType, category) => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    const output = { ...base, title: subject, content_type: contentType, category };
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify(output) }] }] }),
    });
    const result = await extractEventWithOpenAI({ subject, text: subject, html: null, receivedAt: "2026-08-09T10:00:00+05:30" }, fetcher);
    expect(result.content_type).toBe(contentType);
    expect(result.category).toBe(category);
    const request = JSON.parse(fetcher.mock.calls[0][1].body as string);
    expect(request.text.format.strict).toBe(true);
    expect(request.input).toContain("received_at: 2026-08-09");
  });

  it("normalizes unsupported categories to other and permits missing confidence", () => {
    const extraction = normalizeExtraction({ ...base, category: "robot_battle", confidence: undefined });
    expect(extraction.category).toBe("other");
    expect(extraction.confidence).toBeNull();
    expect(extractionPublicationStatus(extraction)).toBe("published");
    expect(normalizeExtraction({ ...base, category: "Hackathon" }).category).toBe("hackathon");
    expect(normalizeExtraction({ ...base, category: "Career / Placement" }).category).toBe("career_placement");
  });

  it("publishes relevant content regardless of confidence or date ambiguity", () => {
    expect(extractionPublicationStatus(normalizeExtraction({ ...base, confidence: 0.2 }))).toBe("published");
    expect(extractionPublicationStatus(normalizeExtraction({ ...base, date_ambiguous: true }))).toBe("published");
    expect(extractionPublicationStatus(normalizeExtraction({ ...base, confidence: 0.9 }))).toBe("published");
  });

  it("never publishes irrelevant content and publishes ambiguous dates as announced", () => {
    expect(extractionPublicationStatus(normalizeExtraction({ ...base, is_relevant: false }))).toBe("rejected");
    const malformed = normalizeExtraction({ ...base, start_time: "tomorrow evening" });
    expect(malformed.start_time).toBeNull();
    expect(malformed.date_ambiguous).toBe(true);
    expect(extractionPublicationStatus(malformed)).toBe("published");
  });

  it("nulls invalid deadline and URL values instead of failing", () => {
    const extraction = normalizeExtraction({
      ...base,
      registration_deadline: "August 30, 2026",
      registration_url: "register here",
      meeting_url: "N/A",
    });
    expect(extraction.registration_deadline).toBeNull();
    expect(extraction.registration_url).toBeNull();
    expect(extraction.meeting_url).toBeNull();
    expect(extraction.start_time).toBe("2026-08-14T17:00:00+05:30");
    expect(extractionPublicationStatus(extraction)).toBe("published");
  });
});
