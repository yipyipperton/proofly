import type { AiResponse, AnalysisMode, AnalysisResult, Category, Concern, RiskLevel, RuleFinding } from "./schema";
import { analyzeWithRules } from "./rules";

export const BASE_LIMITATIONS = [
  "Proofly does not visit links, and makes no domain reputation, blocklist, or threat-intelligence lookups.",
  "Analysis is based only on the text you pasted. Sender details, headers, and attachments are not verified.",
  "Results are advisory and not a guarantee. A low score does not mean a message is safe.",
];

const CATEGORY_STEPS: Record<Category, string[]> = {
  sms: [
    "Don't tap links or call numbers in the text. Open the company's official app or type its website yourself.",
    "Forward suspicious texts to 7726 (SPAM) in the US/Canada, then delete them.",
  ],
  email: [
    "Don't click links or open attachments. Sign in by typing the official website address yourself.",
    "Check the full sender address. A display name can be anything.",
  ],
  job: [
    "Look up the company independently and contact HR through its official website.",
    "Never pay for equipment or training, and never deposit a check and send money on.",
  ],
  marketplace: [
    "Keep all communication and payment inside the marketplace platform.",
    "Meet locally in a public place and only accept payment that has fully cleared.",
  ],
};

export function defaultSteps(category: Category, findings: RuleFinding[]): string[] {
  const steps = [...CATEGORY_STEPS[category]];
  const ids = new Set(findings.map((f) => f.id));
  if (ids.has("credentials")) steps.push("Never share passwords, one-time codes, or ID numbers. If you already did, change your password and call your bank using the number on your card.");
  if (ids.has("payment-giftcard") || ids.has("payment-irreversible")) steps.push("Don't send gift cards, crypto, wire, or instant-app payments to someone you haven't verified.");
  steps.push("If unsure, ask someone you trust, or report it to your national fraud reporting service (e.g. reportfraud.ftc.gov or the Canadian Anti-Fraud Centre).");
  return steps;
}

export function templatedSummary(level: RiskLevel, findings: RuleFinding[]): string {
  if (!findings.length) {
    return "Our rules didn't find common scam patterns in this message. That's a good sign, but it isn't proof that the message is safe. Scams change constantly, so still check the sender through an official channel before you act.";
  }
  const top = findings.slice(0, 3).map((f) => f.title.toLowerCase());
  const list = top.length > 1 ? `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}` : top[0];
  const lead =
    level === "high"
      ? "This message has several strong warning signs that often show up in scams."
      : level === "medium"
        ? "This message has some warning signs worth taking seriously."
        : "This message has a few minor signals, though nothing strongly suspicious.";
  return `${lead} We noticed: ${list}. Don't act on it until you've verified it independently.`;
}

function ruleConcerns(findings: RuleFinding[]): Concern[] {
  return findings.map((f) => ({ title: f.title, explanation: f.explanation, evidence: f.evidence, source: "rule", severity: f.severity }));
}

const ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

/** Keep only evidence quotes that actually appear in the text (guards against AI hallucinated quotes). */
export function groundEvidence(text: string, evidence: string[]): string[] {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/^[…."'\s]+|[…."'\s]+$/g, "");
  const hay = norm(text);
  return evidence.filter((e) => {
    const n = norm(e);
    return n.length > 0 && hay.includes(n);
  });
}

export function buildResult(params: {
  text: string;
  category: Category;
  mode: AnalysisMode;
  ai?: AiResponse;
  notice?: string;
}): AnalysisResult {
  const { text, category, mode, ai, notice } = params;
  const rules = analyzeWithRules(text, category);
  let riskLevel = rules.riskLevel;
  let score = rules.score;
  let summary = templatedSummary(riskLevel, rules.ruleFindings);
  let concerns = ruleConcerns(rules.ruleFindings);
  let limitations = [...BASE_LIMITATIONS];
  let verificationSteps = defaultSteps(category, rules.ruleFindings);

  if (ai) {
    // AI may raise but never lower the rule-based risk below what rules detected.
    if (ORDER[ai.riskLevel] > ORDER[riskLevel]) {
      riskLevel = ai.riskLevel;
      score = Math.max(score, ai.riskLevel === "high" ? 60 : 30);
    }
    summary = ai.summary;
    const aiConcerns: Concern[] = ai.concerns
      .map((c) => ({ title: c.title, explanation: c.explanation, evidence: groundEvidence(text, c.evidence), source: "ai" as const }))
      .filter((c) => c.evidence.length > 0);
    concerns = [...aiConcerns, ...concerns];
    limitations = [...BASE_LIMITATIONS, ...ai.limitations.filter((l) => !/reputation|blocklist|virustotal|whois/i.test(l))].slice(0, 7);
    verificationSteps = ai.verificationSteps.length ? ai.verificationSteps : verificationSteps;
  }

  return {
    mode,
    notice,
    riskLevel,
    score,
    summary,
    concerns,
    ruleFindings: rules.ruleFindings,
    urls: rules.urls,
    limitations,
    verificationSteps,
    category,
    analyzedAt: new Date().toISOString(),
  };
}
