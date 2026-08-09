import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import EventForm from "@/components/CreateEvent/EventForm/EventForm";

describe("student activity form integration", () => {
  it("extends the existing Personal Calendar form with activity lifecycle fields", () => {
    const html = renderToStaticMarkup(React.createElement(EventForm));
    for (const text of [
      "Personal Calendar",
      "Create an activity",
      "Title",
      "Category",
      "Starts",
      "Ends",
      "Capacity",
      "Approve join requests",
      "Create activity",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('name="capacity"');
    expect(html).toContain('name="requires_approval"');
  });
});
