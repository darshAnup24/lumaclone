import "server-only";
import { extractionJsonSchema, normalizeExtraction } from "./extraction";

export async function extractEventWithGroq(
  email: { subject: string; text: string | null; html: string | null; receivedAt: string },
  fetcher: typeof fetch = fetch,
) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!apiKey || !model) throw new Error("GROQ_API_KEY and GROQ_MODEL are required");

  const response = await fetcher("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Extract structured campus content. Resolve relative dates from received_at and default_timezone. Never invent a missing date; mark it ambiguous. Return null confidence when unavailable.",
        },
        {
          role: "user",
          content: `received_at: ${email.receivedAt}\ndefault_timezone: Asia/Kolkata\nsubject: ${email.subject}\ntext: ${email.text ?? ""}\nhtml: ${email.html ?? ""}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "campus_event_extraction",
          strict: true,
          schema: extractionJsonSchema,
        },
      },
    }),
  });

  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(result.error?.message ?? `Groq returned ${response.status}`);
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no structured output");
  return normalizeExtraction(JSON.parse(content) as Record<string, unknown>);
}
