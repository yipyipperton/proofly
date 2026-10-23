import type { Category, ExtractedUrl, RiskLevel, RuleFinding, Severity } from "./schema";
import { extractAndAnalyzeUrls } from "./urls";

interface Rule {
  id: string;
  title: string;
  explanation: string;
  severity: Severity;
  weight: number;
  patterns: RegExp[];
  categories?: Category[];
}

const W: Record<Severity, number> = { low: 8, medium: 15, high: 25 };

export const RULES: Rule[] = [
  {
    id: "payment-giftcard",
    title: "Asks for payment by gift card",
    explanation: "Legitimate businesses and government agencies don't ask to be paid in gift cards. Scammers like them because they're nearly impossible to trace or reverse.",
    severity: "high", weight: W.high,
    patterns: [/\bgift ?cards?\b/i, /\b(google play|itunes|steam) cards?\b/i],
  },
  {
    id: "payment-irreversible",
    title: "Requests wire transfer, crypto, or instant payment",
    explanation: "Wire transfers, cryptocurrency and instant apps like Zelle, Venmo or Cash App are hard to reverse once sent, which is why scammers push for them.",
    severity: "high", weight: W.high,
    patterns: [/\bwire (transfer|the (money|funds|payment))\b/i, /\bwestern union\b/i, /\bmoneygram\b/i, /\b(bitcoin|btc|crypto(currency)?|usdt|tether)\b/i, /\b(zelle|venmo|cash ?app|e-?transfer)\b/i],
  },
  {
    id: "urgency",
    title: "Creates urgency or threatens consequences",
    explanation: "Pressure to act immediately — or face suspension, arrest or fees — is designed to stop you from pausing to check with someone.",
    severity: "medium", weight: W.medium,
    patterns: [/\b(urgent(ly)?|immediately|right away|act now|within (24|48) (hours|hrs)|final (notice|warning)|last chance|expires? today)\b/i, /\b(suspend(ed)?|locked|deactivat(ed|ion)|arrest(ed)?|warrant|legal action|penalt(y|ies))\b/i],
  },
  {
    id: "credentials",
    title: "Asks for passwords, codes, or sensitive identity data",
    explanation: "No real bank, employer or platform will ask you to share a password, one-time code, PIN, or your full SSN/SIN by message.",
    severity: "high", weight: W.high + 5,
    patterns: [/\b(one[- ]time|verification|security|2fa) (code|pin|passcode)\b/i, /\botp\b/i, /\b(send|share|confirm|provide|reply with|enter) (me |us )?(your |the )?(password|pin|passcode|login)\b/i, /\b(ssn|social security( number)?|social insurance number|sin number)\b/i, /\b(routing number|card (number|details)|cvv|bank (account|login) details)\b/i, /\bverify your (account|identity)\b/i],
  },
  {
    id: "impersonation",
    title: "Claims to be from a well-known organization",
    explanation: "The message names a bank, government agency, delivery company or major brand. Scammers often impersonate trusted names — contact the organization through its official app or a website you type in yourself.",
    severity: "low", weight: W.low,
    patterns: [/\b(usps|fedex|ups|dhl|canada post|royal mail)\b/i, /\b(irs|cra|revenue agency|social security administration|hmrc)\b/i, /\b(amazon|paypal|apple|microsoft|netflix|chase|wells fargo|bank of america|coinbase|geek squad|norton|mcafee)\b/i, /\byour bank\b/i],
  },
  {
    id: "delivery-fee",
    title: "Delivery problem requiring a fee or address update",
    explanation: "Fake 'package on hold' messages ask for a small redelivery fee or address confirmation in order to capture card details.",
    severity: "medium", weight: W.medium,
    patterns: [/\b(package|parcel|shipment|delivery)\b[^.]{0,80}\b(held|on hold|failed|unable|pending|incomplete|redeliver(y)?)\b/i],
  },
  {
    id: "prize",
    title: "Unexpected prize, refund, or money offer",
    explanation: "Messages saying you've won something or are owed a refund you weren't expecting are a classic lure.",
    severity: "medium", weight: W.medium,
    patterns: [/\b(you('ve| have) won|winner|claim your (prize|reward|refund)|unclaimed (funds|refund)|tax refund)\b/i],
  },
  {
    id: "secrecy",
    title: "Asks you to keep it secret",
    explanation: "Requests for secrecy isolate you from people who might recognize the scam.",
    severity: "medium", weight: W.medium,
    patterns: [/\b(don'?t|do not) (tell|inform) (anyone|your (bank|family))\b/i, /\bkeep (this|it) (confidential|secret|between us)\b/i],
  },
  {
    id: "job-upfront",
    title: "Job requires you to pay upfront",
    explanation: "Real employers don't charge you for training, equipment, background checks or 'starter kits'.",
    severity: "high", weight: W.high, categories: ["job"],
    patterns: [/\b(pay|purchase|buy)\b[^.]{0,40}\b(training|equipment|starter kit|background check|registration|onboarding)\b/i, /\b(registration|training|processing|onboarding) fee\b/i],
  },
  {
    id: "check-cashing",
    title: "Asks you to deposit a check and send money on",
    explanation: "In fake-check scams you deposit a check, forward part of the funds, and the check bounces days later — leaving you responsible for the full amount.",
    severity: "high", weight: W.high + 5, categories: ["job", "marketplace"],
    patterns: [/\b(deposit|cash)\b[^.]{0,60}\b(check|cheque)s?\b/i, /\b(check|cheque)s?\b[^.]{0,80}\b(send|forward|transfer)\b[^.]{0,30}\b(rest|remaining|balance|difference|vendor)\b/i],
  },
  {
    id: "job-too-good",
    title: "High pay with no real interview",
    explanation: "High pay for little work, 'no experience needed', and interviews held only over chat apps are common signs of job scams.",
    severity: "medium", weight: W.medium, categories: ["job"],
    patterns: [/\bno (experience|interview) (needed|required)\b/i, /\$\s?\d{2,4}\s?(\/|per )\s?(hour|hr|day)\b/i, /\b(interview|chat)\b[^.]{0,20}\b(telegram|whatsapp|signal|google chat|hangouts)\b/i],
  },
  {
    id: "mkt-overpay",
    title: "Buyer offers to overpay",
    explanation: "Overpaying and then asking you to refund the difference is a well-known marketplace scam — the original payment is later reversed.",
    severity: "high", weight: W.high, categories: ["marketplace"],
    patterns: [/\b(overpa(y|id|yment)|extra (money|amount)|more than (the |your )?asking)\b/i, /\b(refund|send back|return) (me )?(the )?(difference|extra|balance)\b/i],
  },
  {
    id: "off-platform",
    title: "Wants to move the conversation off the platform",
    explanation: "Moving to text, WhatsApp or personal email removes the platform's protections and records.",
    severity: "medium", weight: W.medium, categories: ["marketplace", "job"],
    patterns: [/\b(text|message|contact|email|reach) me (at|on|via|directly)\b/i, /\b(whatsapp|telegram|signal|my (personal )?email)\b/i],
  },
  {
    id: "mkt-shipping",
    title: "Shipping-only deal or pickup by the other party's 'agent'",
    explanation: "Insisting on shipping only, refusing to meet, or sending 'their' courier or mover is common in marketplace fraud.",
    severity: "medium", weight: W.medium, categories: ["marketplace"],
    patterns: [/\b(ship(ping)? only|can'?t meet|out of (town|the country)|my (mover|courier|agent|shipping company)\b[^.]{0,30}\b(pick|collect))/i, /\b(pay|cover)\b[^.]{0,15}\bshipping (fee|insurance|cost)\b/i],
  },
  {
    id: "mkt-code",
    title: "Asks for a code to 'prove you're real'",
    explanation: "A buyer asking you to read back a code sent to your phone is usually trying to take over an account or register a number in your name.",
    severity: "high", weight: W.high, categories: ["marketplace"],
    patterns: [/\bcode\b[^.]{0,60}\b(prove|make sure|verify) (you'?re|you are|that you'?re) (real|legit|not a (bot|scammer))\b/i],
  },
];

function quoteAround(text: string, idx: number, len: number): string {
  const start = Math.max(0, idx - 50);
  const end = Math.min(text.length, idx + len + 50);
  let s = start;
  if (s > 0) {
    const sp = text.indexOf(" ", s);
    if (sp !== -1 && sp < idx) s = sp + 1;
  }
  let e = end;
  if (e < text.length) {
    const sp = text.lastIndexOf(" ", e);
    if (sp > idx + len) e = sp;
  }
  const q = text.slice(s, e).replace(/\s+/g, " ").trim();
  return (s > 0 ? "…" : "") + q + (e < text.length ? "…" : "");
}

export function runRules(text: string, category: Category): RuleFinding[] {
  const findings: RuleFinding[] = [];
  for (const rule of RULES) {
    if (rule.categories && !rule.categories.includes(category)) continue;
    const evidence: string[] = [];
    for (const p of rule.patterns) {
      const re = new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g");
      for (const m of text.matchAll(re)) {
        const q = quoteAround(text, m.index ?? 0, m[0].length);
        if (!evidence.includes(q)) evidence.push(q);
        if (evidence.length >= 2) break;
      }
      if (evidence.length >= 2) break;
    }
    if (evidence.length) {
      findings.push({ id: rule.id, title: rule.title, explanation: rule.explanation, severity: rule.severity, weight: rule.weight, evidence });
    }
  }
  return findings;
}

const SEVERE_URL = /IP address|Punycode|'@'|Brand name|resembles/;

export function urlFindings(urls: ExtractedUrl[]): RuleFinding[] {
  const flagged = urls.filter((u) => u.issues.length > 0);
  if (!flagged.length) return [];
  const severe = flagged.some((u) => u.issues.some((i) => SEVERE_URL.test(i)));
  return [
    {
      id: "url-structure",
      title: "Links with suspicious structure",
      explanation:
        "One or more links have structural traits common in phishing (hidden destinations, look-alike domains, raw IPs, unusual endings). Proofly never visits links and performs no reputation lookups — this is based on the text of the link only.",
      severity: severe ? "high" : "medium",
      weight: Math.min(35, (severe ? W.high : W.medium) + (flagged.length - 1) * 5),
      evidence: flagged.slice(0, 4).map((u) => `${u.raw} — ${u.issues[0]}`),
    },
  ];
}

export function scoreFindings(findings: RuleFinding[]): { score: number; riskLevel: RiskLevel } {
  const raw = findings.reduce((s, f) => s + f.weight, 0);
  const highs = findings.filter((f) => f.severity === "high").length;
  const score = Math.max(0, Math.min(100, Math.round(raw + (highs >= 2 ? 10 : 0))));
  const riskLevel: RiskLevel =
    score >= 55 || highs >= 2 ? "high" : score >= 25 || highs === 1 ? "medium" : "low";
  return { score, riskLevel };
}

export function analyzeWithRules(text: string, category: Category) {
  const urls = extractAndAnalyzeUrls(text);
  const ruleFindings = [...runRules(text, category), ...urlFindings(urls)].sort((a, b) => b.weight - a.weight);
  return { urls, ruleFindings, ...scoreFindings(ruleFindings) };
}
