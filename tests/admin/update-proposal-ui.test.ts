import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ui = readFileSync(resolve("src/components/Admin/AdminReviewList.tsx"), "utf8");
const repository = readFileSync(resolve("src/lib/admin/review.ts"), "utf8");

describe("admin update proposal workflow", () => {
  it("shows the target identity and old/new values", () => {
    expect(ui).toContain("Possible update to");
    expect(ui).toContain('>Old</span>');
    expect(ui).toContain('>New</span>');
    expect(repository).toContain("proposedUpdateFor");
  });

  it("offers each required proposal resolution", () => {
    expect(ui).toContain("Apply Update");
    expect(ui).toContain("Create New");
    expect(ui).toContain('submit(e.currentTarget.form!, "reject")');
  });

  it("delegates identity-preserving decisions to the locked database function", () => {
    expect(repository).toContain('.rpc("resolve_event_proposal"');
    expect(repository).toContain("proposal_id: eventId");
  });
});
