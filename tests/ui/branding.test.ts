import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("LeviClub branding", () => {
  it("uses the LeviClub wordmark without legacy raster branding", () => {
    const brand = read("src/components/BrandLogo.tsx");
    const landing = read("src/app/page.tsx");
    const footer = read("src/components/Footer.tsx");

    expect(brand).toContain("leviclub");
    expect(landing).toContain("<BrandWordmark");
    expect(footer).toContain("<BrandWordmark");
    expect(landing).not.toContain("/Luma/wordmark");
    expect(footer).not.toContain("/Luma/wordmark");
  });

  it("keeps every footer link on the application home page", () => {
    const footer = read("src/components/Footer.tsx");
    const hrefs = [...footer.matchAll(/<Link\s+href="([^"]+)"/g)].map(
      ([, href]) => href,
    );

    expect(hrefs.length).toBeGreaterThan(0);
    expect(new Set(hrefs)).toEqual(new Set(["/"]));
    expect(footer).not.toMatch(/https?:\/\/|mailto:/);
  });

  it("contains no visible legacy brand strings in English copy", () => {
    const english = read("src/translations/en/global.json");

    expect(english).toContain("LeviClub");
    expect(english).not.toMatch(/Luma/);
  });
});
