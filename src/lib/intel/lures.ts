/**
 * Deterministic lexicon of scam "lure types". Each lure has:
 *  - alert: patterns that classify a public alert (title + summary) as being about this lure
 *  - text: patterns that detect the same lure in a pasted message (ALL groups must match)
 */
export interface Lure {
  id: string;
  label: string;
  alert: RegExp;
  text: RegExp[];
}

export const LURES: Lure[] = [
  { id: "toll", label: "Unpaid toll / traffic fine texts", alert: /\b(toll|e-?zpass|sunpass|fastrak|407 etr|traffic (ticket|fine|violation))\b/i, text: [/\b(toll|e-?zpass|sunpass|fastrak|407|parking|traffic) ?(fee|fine|violation|balance|charges?|ticket)?\b/i, /\b(unpaid|outstanding|overdue|balance|owe|pay)\b/i] },
  { id: "delivery", label: "Fake package delivery notices", alert: /\b(package|parcel|delivery|usps|fedex|ups|dhl|canada post|shipping) (scam|text|notice|problem)s?\b|\b(usps|fedex|canada post|delivery)\b[^.]{0,40}\bscam/i, text: [/\b(package|parcel|shipment|delivery)\b/i, /\b(held|on hold|failed|redeliver|update|address|fee|confirm)\b/i] },
  { id: "billing", label: "Fake billing / payment-failed notices", alert: /\b(bill(ing)?|payment|invoice|subscription|account)\b[^.]{0,50}\b(scam|phishing|fake|imposter)|\b(scam|phishing|fake)\b[^.]{0,50}\b(bill(ing)?|payment|invoice|subscription|renewal)\b|\btext messages?\b[^.]{0,40}\bscam/i, text: [/\b(bill(ing)?|payment|invoice|subscription|card)\b/i, /\b(unable to process|failed|declined|update|verify|confirm|suspend\w*|overdue|unpaid)\b/i] },
  { id: "phone-deactivation", label: "Phone number / account deactivation threats", alert: /\b(deactivat\w*|disconnect\w*|suspend\w*)\b[^.]{0,40}\b(phone|number|account|sim)\b/i, text: [/\b(deactivat\w*|disconnect\w*|suspend\w*|terminate\w*)\b/i, /\b(phone|number|line|sim|account|service)\b/i] },
  { id: "government", label: "Government agency impersonation", alert: /\b(government|agency|irs|cra|ftc|fbi|police|rcmp|social security|ssa|passport|immigration|official)s?\b[^.]{0,60}\b(impersonat\w*|scam|imposter)|\b(impersonat\w*|imposter)\b[^.]{0,60}\b(government|agency|official|police|irs|cra|ftc|fbi|rcmp|ssa)/i, text: [/\b(irs|cra|canada revenue|ftc|fbi|rcmp|police|social security|ssa|service canada|passport|immigration|government)\b/i, /\b(warrant|arrest|fine|penalt\w*|suspend\w*|owe|pay|verify|deactivat\w*|legal action|benefit)\b/i] },
  { id: "job", label: "Fake job / task-based work offers", alert: /\b(job|employment|task|work[- ]from[- ]home|recruit\w*|hiring)\b[^.]{0,40}\b(scam|fraud|fake)|\b(fake|scam)\b[^.]{0,40}\b(job|recruit\w*|employment)/i, text: [/\b(job|position|hiring|recruit\w*|remote|tasks?|commission)\b/i, /\b(pay|earn|salary|\$\s?\d+|per (hour|day)|deposit|check|crypto|telegram|whatsapp)\b/i] },
  { id: "tech-support", label: "Tech support / account security scams", alert: /\b(tech(nical)? support|computer (virus|security)|microsoft|apple support|geek squad|norton|mcafee|refund)\b[^.]{0,40}\b(scam|fraud)/i, text: [/\b(tech(nical)? support|virus|hacked|compromised|microsoft|apple support|geek squad|norton|mcafee|refund)\b/i, /\b(call|contact|remote access|install|pay|renew)\b/i] },
  { id: "investment", label: "Crypto / investment scams", alert: /\b(crypto\w*|bitcoin|investment|trading)\b[^.]{0,40}\b(scam|fraud)|\b(pig butchering|investment fraud)\b/i, text: [/\b(crypto\w*|bitcoin|invest\w*|trading|returns?|profit)\b/i, /\b(guarantee\w*|double|platform|wallet|deposit|withdraw)\b/i] },
  { id: "bank-impersonation", label: "Bank / fraud department impersonation", alert: /\b(bank|fraud department|credit card)\b[^.]{0,40}\b(impersonat\w*|scam|imposter)/i, text: [/\b(bank|fraud (department|team)|card (has been|was) (locked|used)|suspicious (activity|transaction))\b/i, /\b(verify|confirm|code|pin|move (your )?money|safe account|call)\b/i] },
  { id: "prize", label: "Prize, sweepstakes, or lottery scams", alert: /\b(prize|sweepstakes|lottery|giveaway)\b/i, text: [/\b(won|winner|prize|sweepstakes|lottery|giveaway)\b/i, /\b(claim|fee|pay|tax|shipping|deposit)\b/i] },
  { id: "rental", label: "Rental / housing listing scams", alert: /\b(rental|housing|apartment|landlord)\b[^.]{0,40}\b(scam|fraud)/i, text: [/\b(rent|rental|apartment|lease|landlord)\b/i, /\b(deposit|first month|e-?transfer|wire|out of (town|the country)|can'?t show)\b/i] },
  { id: "tickets", label: "Fake event ticket sellers", alert: /\btickets?\b[^.]{0,40}\b(scam|fraud|deceptive|fake)|\b(scam|fake)\b[^.]{0,40}\btickets?/i, text: [/\btickets?\b/i, /\b(e-?transfer|zelle|venmo|cash ?app|pay|deposit|sold out)\b/i] },
  { id: "romance", label: "Romance scams", alert: /\b(romance|dating|sextortion)\b/i, text: [/\b(love|darling|dear|soulmate|relationship|dating)\b/i, /\b(money|gift ?cards?|crypto|send|help|emergency|visa|flight)\b/i] },
  { id: "election", label: "Election-related scams", alert: /\belection\b[^.]{0,60}\b(scam|fraud)|\b(scam|fraud)\w*\b[^.]{0,60}\belection\b/i, text: [/\b(election|vote|voter|ballot|campaign)\b/i, /\b(donat\w*|pay|verify|register|fee|gift)\b/i] },
  { id: "grandparent", label: "Family emergency / grandparent scams", alert: /\b(grandparent|family emergency)\b/i, text: [/\b(grandma|grandpa|mom|dad|it'?s me|new number)\b/i, /\b(jail|bail|accident|emergency|urgent|money|help)\b/i] },
  { id: "passport", label: "Fake passport / document service sites", alert: /\bpassport\b/i, text: [/\bpassport\b/i, /\b(fee|renew\w*|expedit\w*|apply|application|pay)\b/i] },
];

export function luresInAlert(text: string): string[] {
  return LURES.filter((l) => l.alert.test(text)).map((l) => l.id);
}

export function luresInMessage(text: string): string[] {
  return LURES.filter((l) => l.text.every((re) => re.test(text))).map((l) => l.id);
}

export const LURE_LABELS: Record<string, string> = Object.fromEntries(LURES.map((l) => [l.id, l.label]));

/** Brands frequently impersonated; extracted from alerts deterministically. */
export const INTEL_BRANDS = [
  "Amazon", "PayPal", "Apple", "Microsoft", "Netflix", "USPS", "FedEx", "UPS", "DHL", "Canada Post",
  "IRS", "CRA", "FTC", "FBI", "RCMP", "Social Security", "Medicare", "Walmart", "Costco", "Best Buy",
  "Geek Squad", "Norton", "McAfee", "Venmo", "Zelle", "Cash App", "Coinbase", "Facebook", "Instagram",
  "WhatsApp", "Telegram", "Ticketmaster", "Freedom Mobile", "Rogers", "Bell", "Telus", "Verizon", "AT&T", "T-Mobile",
  "E-ZPass", "407 ETR", "Interac", "Service Canada",
];

export function brandsIn(text: string): string[] {
  return INTEL_BRANDS.filter((b) => new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\&-]/g, "\\$&")}\\b`, "i").test(text));
}
