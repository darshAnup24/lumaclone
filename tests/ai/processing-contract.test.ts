import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const processor = readFileSync(resolve("src/lib/ai/process.ts"), "utf8");

describe("AI extraction persistence contract", () => {
  it("stores extraction, confidence, source linkage, and publication timestamp", () => {
    expect(processor).toContain("extraction_result: extraction");
    expect(processor).toContain("confidence_score: extraction.confidence");
    expect(processor).toContain("inbound_email_id: email.id");
    expect(processor).toContain('source: "email"');
    expect(processor).toContain('published_at: status === "published"');
  });

  it("records extraction failures as reviewable inbound failures", () => {
    expect(processor).toContain('processing_status: "failed"');
    expect(processor).toContain("error_message: message");
    expect(processor).toContain("return { status: \"failed\" as const");
  });

  it("suppresses exact repeats and turns likely updates into review proposals", () => {
    expect(processor).toContain("alreadyProcessed");
    expect(processor).toContain('duplicate.kind === "exact"');
    expect(processor).toContain('return { status: "duplicate" as const');
    expect(processor).toContain('duplicate.kind === "possible_update" ? "pending_review"');
    expect(processor).toContain("proposed_update_for_event_id: duplicate.candidate?.id");
  });
});
