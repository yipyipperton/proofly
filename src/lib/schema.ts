import { z } from "zod";

export const CATEGORIES = ["sms", "email", "job", "marketplace"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  sms: "SMS",
  email: "Email",
  job: "Job offer",
  marketplace: "Marketplace",
};

export const MAX_TEXT = 8000;
export const MIN_TEXT = 10;

export const AnalyzeInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(MIN_TEXT, `Please paste at least ${MIN_TEXT} characters.`)
    .max(MAX_TEXT, `Messages are limited to ${MAX_TEXT} characters.`),
  category: z.enum(CATEGORIES),
});
export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export const RiskLevel = z.enum(["low", "medium", "high"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

/** Shape the AI model must return. */
export const AiConcernSchema = z.object({
  title: z.string().min(1).max(160),
  explanation: z.string().min(1).max(800),
  evidence: z.array(z.string().min(1).max(400)).max(5),
});
export const AiResponseSchema = z.object({
  summary: z.string().min(1).max(1200),
  riskLevel: RiskLevel,
  concerns: z.array(AiConcernSchema).max(8),
  limitations: z.array(z.string().min(1).max(400)).max(6),
  verificationSteps: z.array(z.string().min(1).max(400)).min(1).max(8),
});
export type AiResponse = z.infer<typeof AiResponseSchema>;

export type Severity = "low" | "medium" | "high";

export interface RuleFinding {
  id: string;
  title: string;
  explanation: string;
  severity: Severity;
  weight: number;
  evidence: string[];
}

export interface ExtractedUrl {
  raw: string;
  host: string | null;
  issues: string[];
}

export interface Concern {
  title: string;
  explanation: string;
  evidence: string[];
  source: "rule" | "ai";
  severity?: Severity;
}

export type AnalysisMode = "ai" | "demo" | "fallback";

export interface AnalysisResult {
  mode: AnalysisMode;
  notice?: string;
  riskLevel: RiskLevel;
  score: number;
  summary: string;
  concerns: Concern[];
  ruleFindings: RuleFinding[];
  urls: ExtractedUrl[];
  limitations: string[];
  verificationSteps: string[];
  category: Category;
  analyzedAt: string;
}
