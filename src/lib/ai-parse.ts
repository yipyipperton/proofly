import { AiResponseSchema, type AiResponse } from "./schema";

export class AiParseError extends Error {}

/** Parses and validates raw model output. Throws AiParseError on malformed JSON or schema mismatch. */
export function parseAiResponse(content: string): AiResponse {
  let s = content.trim();
  // tolerate ```json fences
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1];
  let json: unknown;
  try {
    json = JSON.parse(s);
  } catch {
    throw new AiParseError("AI returned malformed JSON");
  }
  const parsed = AiResponseSchema.safeParse(json);
  if (!parsed.success) throw new AiParseError("AI response did not match the expected schema");
  return parsed.data;
}
