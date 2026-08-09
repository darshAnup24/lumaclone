import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(path), "utf8");
const readme = read("README.md");
const envTemplate = read(".env.example");
const webhook = read("src/app/api/webhooks/resend/route.ts");

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET",
  "AI_PROVIDER", "GROQ_API_KEY", "GROQ_MODEL",
];

describe("deployment readiness", () => {
  it.each(requiredVariables)("documents and templates %s", (name) => {
    expect(envTemplate).toContain(`${name}=`);
    expect(readme).toContain(`\`${name}\``);
  });

  it("keeps the committed environment template names-only", () => {
    const assignments = envTemplate.split("\n").filter((line) => line && !line.startsWith("#"));
    expect(assignments.length).toBeGreaterThan(10);
    for (const assignment of assignments) expect(assignment).toMatch(/^[A-Z0-9_]+=$/);
  });

  it("documents every required cloud integration and workflow", () => {
    for (const section of [
      "## Architecture", "## Student events", "## Supabase", "## Resend inbound and outbound",
      "## AI extraction and review", "## Vercel deployment", "## Security notes",
    ]) expect(readme).toContain(section);
    expect(readme).toContain("/api/webhooks/resend");
    expect(readme).toContain("npx supabase db push");
    expect(readme).toContain("openai/gpt-oss-120b");
  });

  it("gives the inbound AI function an explicit Vercel-compatible duration", () => {
    expect(webhook).toContain("export const maxDuration = 60");
  });

  it("does not expose server secrets from client components", () => {
    const clientSources = [
      "src/components/Admin/AdminReviewList.tsx",
      "src/components/CreateEvent/EventForm/EventForm.tsx",
      "src/components/SignIn/SignInForm.tsx",
    ].map(read).join("\n");
    for (const secret of ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "GROQ_API_KEY"]) {
      expect(clientSources).not.toContain(secret);
    }
  });
});
