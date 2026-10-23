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
  severity: Severity;
}

export interface IntelMatchView {
  lure: string;
  label: string;
  alerts: Array<{ source: string; title: string; url: string; date: string | null; brandMatch: boolean }>;
}

export interface IntelInfo {
  updatedAt: string | null;
  alertCount: number;
  sources: Array<{ name: string; ok: boolean }>;
}

export interface AnalysisResult {
  intelMatches: IntelMatchView[];
  intel: IntelInfo | null;
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
