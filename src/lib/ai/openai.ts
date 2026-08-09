import "server-only";
import { extractionJsonSchema, normalizeExtraction } from "./extraction";

export async function extractEventWithOpenAI(
  email: { subject: string; text: string | null; html: string | null; receivedAt: string },
  fetcher: typeof fetch = fetch,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) throw new Error("OPENAI_API_KEY and AI_MODEL are required");
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: "Extract structured campus content. Resolve relative dates from received_at in the supplied timezone. Never invent missing dates; mark ambiguity. Return null confidence when unavailable.",
      input: `received_at: ${email.receivedAt}\ndefault_timezone: Asia/Kolkata\nsubject: ${email.subject}\ntext: ${email.text ?? ""}\nhtml: ${email.html ?? ""}`,
      text: { format: { type: "json_schema", name: "campus_event_extraction", strict: true, schema: extractionJsonSchema } },
    }),
  });
  const result = (await response.json()) as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message ?? `OpenAI returned ${response.status}`);
  const text = result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI returned no structured output");
  return normalizeExtraction(JSON.parse(text) as Record<string, unknown>);
}
