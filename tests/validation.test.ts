import { describe, expect, it } from "vitest";
import { AnalyzeInputSchema, MAX_TEXT } from "@/lib/schema";

describe("AnalyzeInputSchema", () => {
  it("accepts valid input", () => {
    expect(AnalyzeInputSchema.safeParse({ text: "Hello, this is a message", category: "sms" }).success).toBe(true);
  });
  it("rejects too short text", () => {
    expect(AnalyzeInputSchema.safeParse({ text: "   hi    ", category: "sms" }).success).toBe(false);
  });
  it("rejects too long text", () => {
    expect(AnalyzeInputSchema.safeParse({ text: "a".repeat(MAX_TEXT + 1), category: "email" }).success).toBe(false);
  });
  it("rejects unknown category", () => {
    expect(AnalyzeInputSchema.safeParse({ text: "Hello there friend", category: "voicemail" }).success).toBe(false);
  });
  it("rejects missing / wrong types", () => {
    expect(AnalyzeInputSchema.safeParse({ category: "sms" }).success).toBe(false);
    expect(AnalyzeInputSchema.safeParse({ text: 42, category: "sms" }).success).toBe(false);
    expect(AnalyzeInputSchema.safeParse(null).success).toBe(false);
  });
});
