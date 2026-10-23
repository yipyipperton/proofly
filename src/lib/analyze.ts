import type { AnalysisResult, Category, Concern, RiskLevel, RuleFinding } from "./schema";
import { analyzeWithRules } from "./rules";
import type { ScamIntel } from "./intel/feeds";
import { matchIntel } from "./intel/match";

export function intelInfo(intel: ScamIntel | null) {
  if (!intel) return null;
  return { updatedAt: intel.updatedAt, alertCount: intel.alerts.length, sources: intel.sources.map((s) => ({ name: s.name, ok: s.ok })) };
}

export const BASE_LIMITATIONS = [
  "Proofly does not visit links in your message and makes no domain reputation or blocklist lookups. Pattern matches come only from public government scam alerts.",
  "Analysis uses fixed, transparent pattern rules on only on the text you pasted. Sender details, headers, and attachments are not verified.",
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

const CATEGORY_CONTEXT: Record<Category, string> = {
  sms: "Scam texts often pretend to be a delivery company, bank or toll agency and push you to tap a link fast.",
  email: "Phishing emails copy the look of real companies. The sender name and logo can be faked easily.",
  job: "Fake job offers usually end with you paying for something or passing money along for the 'employer'.",
  marketplace: "Marketplace scammers try to get you off the platform, or to send money or codes before a real sale happens.",
};

export function templatedSummary(level: RiskLevel, findings: RuleFinding[], category: Category = "sms"): string {
  if (!findings.length) {
    return "We didn't find the common scam patterns we check for. That's a good sign, but it isn't proof the message is safe. Scams change all the time, so if it asks you to pay, sign in or share anything personal, check with the sender through a channel you already trust.";
  }
  const top = findings.slice(0, 3).map((f) => f.title.toLowerCase());
  const list = top.length > 1 ? `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}` : top[0];
  const lead =
    level === "high"
      ? "This message shows several strong warning signs that are very common in scams."
      : level === "medium"
        ? "This message has some warning signs worth taking seriously."
        : "This message has a few minor signals, though nothing strongly suspicious on its own.";
  const close =
    level === "high"
      ? "We'd strongly suggest not replying, paying or tapping any links until you've confirmed it independently."
      : "Before you act on it, verify it independently.";
  return `${lead} We noticed: ${list}. ${CATEGORY_CONTEXT[category]} ${close}`;
}

function ruleConcerns(findings: RuleFinding[]): Concern[] {
  return findings.map((f) => ({ title: f.title, explanation: f.explanation, evidence: f.evidence, severity: f.severity }));
}

export function buildResult(params: { text: string; category: Category; intel?: ScamIntel | null }): AnalysisResult {
  const { text, category, intel = null } = params;
  const rules = analyzeWithRules(text, category);
  const intelMatches = matchIntel(text, intel);
  // A known-pattern match adds weight, but only alongside at least one rule finding.
  let score = rules.score;
  let riskLevel = rules.riskLevel;
  if (intelMatches.length && rules.ruleFindings.length) {
    score = Math.min(100, score + Math.min(15, intelMatches.length * 8));
    if (riskLevel === "low" && score >= 25) riskLevel = "medium";
    if (riskLevel === "medium" && score >= 55) riskLevel = "high";
  }
  let summary = templatedSummary(riskLevel, rules.ruleFindings, category);
  if (intelMatches.length) {
    summary += ` It also resembles a scam type publicly reported by ${[...new Set(intelMatches.flatMap((m) => m.alerts.map((a) => a.source)))].slice(0, 2).join(" and ")}: ${intelMatches.map((m) => m.label.toLowerCase()).join("; ")}.`;
  }
  return {
    intelMatches,
    intel: intelInfo(intel),
    riskLevel,
    score,
    summary,
    concerns: ruleConcerns(rules.ruleFindings),
    ruleFindings: rules.ruleFindings,
    urls: rules.urls,
    limitations: [...BASE_LIMITATIONS],
    verificationSteps: defaultSteps(category, rules.ruleFindings),
    category,
    analyzedAt: new Date().toISOString(),
  };
}
