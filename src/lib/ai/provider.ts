import "server-only";
import { extractEventWithGroq } from "./groq";
import { extractEventWithOpenAI } from "./openai";

export type ExtractionEmail = {
  subject: string;
  text: string | null;
  html: string | null;
  receivedAt: string;
};

export function extractEvent(email: ExtractionEmail) {
  const provider = process.env.AI_PROVIDER ?? "groq";
  if (provider === "groq") return extractEventWithGroq(email);
  if (provider === "openai") return extractEventWithOpenAI(email);
  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
