import { afterEach, describe, expect, it, vi } from "vitest";
import { AiParseError, parseAiResponse } from "@/lib/ai-parse";
import { AiError, callAi } from "@/lib/ai";

const valid = {
  summary: "Several red flags.",
  riskLevel: "high",
  concerns: [{ title: "Gift cards", explanation: "Scam payment", evidence: ["gift cards"] }],
  limitations: ["Text only"],
  verificationSteps: ["Call the company"],
};

describe("parseAiResponse", () => {
  it("accepts valid JSON", () => expect(parseAiResponse(JSON.stringify(valid)).riskLevel).toBe("high"));
  it("accepts fenced JSON", () => expect(parseAiResponse("```json\n" + JSON.stringify(valid) + "\n```").summary).toBeTruthy());
  it("rejects malformed JSON", () => {
    expect(() => parseAiResponse("{not json")).toThrow(AiParseError);
    expect(() => parseAiResponse("")).toThrow(/malformed/);
  });
  it("rejects schema mismatch", () => {
    expect(() => parseAiResponse(JSON.stringify({ ...valid, riskLevel: "extreme" }))).toThrow(/schema/);
    expect(() => parseAiResponse(JSON.stringify({ summary: "x" }))).toThrow(AiParseError);
    expect(() => parseAiResponse(JSON.stringify({ ...valid, concerns: [{ title: 1 }] }))).toThrow(AiParseError);
    expect(() => parseAiResponse("[]")).toThrow(AiParseError);
  });
});

describe("callAi", () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });
  const mk = (content: unknown, status = 200) =>
    vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status })) as unknown as typeof fetch;

  it("throws when not configured", async () => {
    await expect(callAi("hello world!", "sms", [])).rejects.toThrow(AiError);
  });
  it("returns parsed data", async () => {
    process.env.OPENAI_API_KEY = "test";
    const r = await callAi("hello world!", "sms", [], { fetchImpl: mk(JSON.stringify(valid)) });
    expect(r.concerns).toHaveLength(1);
  });
  it("throws on malformed model output", async () => {
    process.env.OPENAI_API_KEY = "test";
    await expect(callAi("hello world!", "sms", [], { fetchImpl: mk("nope{") })).rejects.toThrow();
  });
  it("throws on schema mismatch", async () => {
    process.env.OPENAI_API_KEY = "test";
    await expect(callAi("hello world!", "sms", [], { fetchImpl: mk(JSON.stringify({ a: 1 })) })).rejects.toThrow();
  });
  it("throws on HTTP error", async () => {
    process.env.OPENAI_API_KEY = "test";
    await expect(callAi("hello world!", "sms", [], { fetchImpl: mk("x", 500) })).rejects.toThrow(/HTTP 500/);
  });
});
