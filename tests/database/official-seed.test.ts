import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const seedPath = resolve("supabase/seed.sql");
const seed = readFileSync(seedPath, "utf8");
const normalized = seed.replace(/\s+/g, " ").toLowerCase();

describe("official campus demonstration seed", () => {
  it("is enabled and reproducible through the Supabase seed configuration", () => {
    const config = readFileSync(resolve("supabase/config.toml"), "utf8");
    expect(config).toMatch(/\[db\.seed\][\s\S]*enabled\s*=\s*true/);
    expect(config).toContain('sql_paths = ["./seed.sql"]');
    expect(normalized.match(/on conflict \(id\) do update/g)).toHaveLength(2);
  });

  it("contains exactly five stable official event records", () => {
    const ids = seed.match(/20000000-0000-4000-8000-00000000000[1-5]/g) ?? [];
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(normalized.match(/'official'/g)).toHaveLength(5);
    expect(normalized.match(/'admin'/g)).toHaveLength(5);
    expect(normalized.match(/'published'/g)).toHaveLength(5);
  });

  it.each([
    "Full Stack Web Development Workshop",
    "AI/ML Career Conference",
    "24-Hour Campus Hackathon",
    "Golden Hour Photography Walk",
    "Startup & Entrepreneurship Meetup",
  ])("includes the realistic event %s", (title) => {
    expect(seed).toContain(title);
  });

  it("covers realistic discovery categories, locations, capacities, and descriptions", () => {
    for (const category of [
      "workshop",
      "career_placement",
      "hackathon",
      "club_activity",
      "networking",
    ]) {
      expect(normalized).toContain(`'${category}'`);
    }
    expect(normalized.match(/'asia\/kolkata'/g)).toHaveLength(5);
    expect(normalized.match(/'physical'/g)).toHaveLength(5);
    for (const location of [
      "Software Systems Lab, Academic Block B",
      "Main Auditorium",
      "Innovation Centre",
      "Main Gate",
      "Campus Incubation Hub",
    ]) {
      expect(seed).toContain(location);
    }
  });

  it("uses ordered future schedules and registration deadlines", () => {
    const timestamps = [...seed.matchAll(/'(2026-[^']+\+05:30)'/g)].map(
      (match) => new Date(match[1]),
    );
    expect(timestamps).toHaveLength(20);
    for (let index = 0; index < timestamps.length; index += 4) {
      const [start, end, deadline, published] = timestamps.slice(index, index + 4);
      expect(start.getTime()).toBeLessThan(end.getTime());
      expect(deadline.getTime()).toBeLessThan(start.getTime());
      expect(published.getTime()).toBeLessThan(start.getTime());
    }
  });

  it("seeds verified organizations without changing runtime authorization", () => {
    expect(normalized.match(/10000000-0000-4000-8000-00000000000[1-4]/g)?.length).toBe(
      9,
    );
    expect(normalized.match(/ true, true/g)).toHaveLength(4);
    expect(normalized).not.toContain("auth.users");
    expect(normalized).not.toContain("service_role");
    expect(normalized).not.toContain("create policy");
    expect(normalized).not.toContain("create function");
  });

  it("gives every official event a remote cover image", () => {
    expect(normalized.match(/https:\/\/images\.unsplash\.com\/photo-/g)).toHaveLength(
      5,
    );
    expect(normalized).toContain("cover_image_url = excluded.cover_image_url");
  });

  it("feeds every existing event view through the published repository", () => {
    for (const page of ["home", "discover", "calendars"]) {
      expect(readFileSync(resolve(`src/app/${page}/page.tsx`), "utf8")).toContain(
        "loadPublishedEvents",
      );
    }
    const repository = readFileSync(resolve("src/lib/events/repository.ts"), "utf8");
    expect(repository).toContain('.eq("status", "published")');
  });
});
