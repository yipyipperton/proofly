/**
 * Commonly impersonated brands with their official registrable domains.
 * `tokens` are the strings we look for inside link domains; `names` are matched in message text.
 */
export interface Brand {
  id: string;
  names: string[];
  tokens: string[];
  official: string[];
}

export const BRANDS: Brand[] = [
  // Canadian telecoms
  { id: "freedom", names: ["Freedom Mobile"], tokens: ["freedom", "freedommobile"], official: ["freedommobile.ca"] },
  { id: "rogers", names: ["Rogers"], tokens: ["rogers"], official: ["rogers.com", "rogers.ca"] },
  { id: "bell", names: ["Bell Canada", "Bell Mobility", "Bell"], tokens: ["bell", "bellcanada", "bellmobility"], official: ["bell.ca"] },
  { id: "telus", names: ["Telus"], tokens: ["telus"], official: ["telus.com"] },
  { id: "fido", names: ["Fido"], tokens: ["fido"], official: ["fido.ca"] },
  { id: "koodo", names: ["Koodo"], tokens: ["koodo"], official: ["koodomobile.com", "koodo.com"] },
  { id: "virgin", names: ["Virgin Plus", "Virgin Mobile"], tokens: ["virginplus", "virginmobile", "virgin"], official: ["virginplus.ca", "virginmobile.ca"] },
  { id: "videotron", names: ["Videotron", "Vidéotron"], tokens: ["videotron"], official: ["videotron.com"] },
  { id: "chatr", names: ["Chatr"], tokens: ["chatr"], official: ["chatrwireless.com"] },
  { id: "publicmobile", names: ["Public Mobile"], tokens: ["publicmobile"], official: ["publicmobile.ca"] },
  // US telecoms
  { id: "verizon", names: ["Verizon"], tokens: ["verizon"], official: ["verizon.com", "verizonwireless.com"] },
  { id: "att", names: ["AT&T", "ATT"], tokens: ["att", "attwireless"], official: ["att.com", "att.net"] },
  { id: "tmobile", names: ["T-Mobile", "TMobile"], tokens: ["tmobile", "t-mobile"], official: ["t-mobile.com"] },
  // Utilities
  { id: "hydroone", names: ["Hydro One"], tokens: ["hydroone"], official: ["hydroone.com"] },
  { id: "enbridge", names: ["Enbridge"], tokens: ["enbridge"], official: ["enbridge.com", "enbridgegas.com"] },
  { id: "bchydro", names: ["BC Hydro"], tokens: ["bchydro"], official: ["bchydro.com"] },
  { id: "pge", names: ["PG&E"], tokens: ["pge"], official: ["pge.com"] },
  { id: "coned", names: ["Con Edison", "ConEd"], tokens: ["coned", "conedison"], official: ["coned.com"] },
  // Delivery
  { id: "canadapost", names: ["Canada Post", "Postes Canada"], tokens: ["canadapost", "postescanada"], official: ["canadapost-postescanada.ca", "canadapost.ca"] },
  { id: "purolator", names: ["Purolator"], tokens: ["purolator"], official: ["purolator.com"] },
  { id: "usps", names: ["USPS", "US Postal Service", "Postal Service"], tokens: ["usps"], official: ["usps.com"] },
  { id: "fedex", names: ["FedEx"], tokens: ["fedex"], official: ["fedex.com"] },
  { id: "ups", names: ["UPS"], tokens: ["ups"], official: ["ups.com"] },
  { id: "dhl", names: ["DHL"], tokens: ["dhl"], official: ["dhl.com", "dhl.ca"] },
  // Government
  { id: "cra", names: ["CRA", "Canada Revenue Agency"], tokens: ["cra", "canadarevenue"], official: ["canada.ca", "gc.ca"] },
  { id: "servicecanada", names: ["Service Canada"], tokens: ["servicecanada"], official: ["canada.ca", "gc.ca"] },
  { id: "irs", names: ["IRS", "Internal Revenue Service"], tokens: ["irs"], official: ["irs.gov"] },
  { id: "ssa", names: ["Social Security Administration"], tokens: ["ssa", "socialsecurity"], official: ["ssa.gov"] },
  { id: "ezpass", names: ["E-ZPass", "EZPass"], tokens: ["ezpass", "e-zpass"], official: ["e-zpassny.com", "ezpassnj.com", "e-zpassiag.com"] },
  { id: "407etr", names: ["407 ETR"], tokens: ["407etr"], official: ["407etr.com"] },
  // Banks / payments
  { id: "interac", names: ["Interac"], tokens: ["interac"], official: ["interac.ca"] },
  { id: "rbc", names: ["RBC", "Royal Bank"], tokens: ["rbc", "royalbank"], official: ["rbc.com", "rbcroyalbank.com"] },
  { id: "td", names: ["TD Bank", "TD Canada Trust", "TD"], tokens: ["td", "tdbank", "tdcanadatrust"], official: ["td.com", "tdbank.com"] },
  { id: "bmo", names: ["BMO", "Bank of Montreal"], tokens: ["bmo"], official: ["bmo.com"] },
  { id: "scotiabank", names: ["Scotiabank"], tokens: ["scotiabank", "scotia"], official: ["scotiabank.com"] },
  { id: "cibc", names: ["CIBC"], tokens: ["cibc"], official: ["cibc.com"] },
  { id: "desjardins", names: ["Desjardins"], tokens: ["desjardins"], official: ["desjardins.com"] },
  { id: "tangerine", names: ["Tangerine"], tokens: ["tangerine"], official: ["tangerine.ca"] },
  { id: "chase", names: ["Chase"], tokens: ["chase"], official: ["chase.com"] },
  { id: "wellsfargo", names: ["Wells Fargo"], tokens: ["wellsfargo"], official: ["wellsfargo.com"] },
  { id: "bofa", names: ["Bank of America"], tokens: ["bankofamerica", "bofa"], official: ["bankofamerica.com"] },
  { id: "citi", names: ["Citibank", "Citi"], tokens: ["citibank"], official: ["citi.com", "citibank.com"] },
  { id: "paypal", names: ["PayPal"], tokens: ["paypal"], official: ["paypal.com"] },
  { id: "venmo", names: ["Venmo"], tokens: ["venmo"], official: ["venmo.com"] },
  { id: "zelle", names: ["Zelle"], tokens: ["zelle"], official: ["zellepay.com"] },
  { id: "cashapp", names: ["Cash App"], tokens: ["cashapp"], official: ["cash.app"] },
  { id: "coinbase", names: ["Coinbase"], tokens: ["coinbase"], official: ["coinbase.com"] },
  { id: "binance", names: ["Binance"], tokens: ["binance"], official: ["binance.com"] },
  // Tech / retail / streaming
  { id: "amazon", names: ["Amazon"], tokens: ["amazon", "amzn"], official: ["amazon.com", "amazon.ca", "amazon.co.uk", "amzn.to"] },
  { id: "apple", names: ["Apple", "iCloud", "Apple ID"], tokens: ["apple", "icloud", "appleid"], official: ["apple.com", "icloud.com"] },
  { id: "microsoft", names: ["Microsoft", "Outlook", "Office 365"], tokens: ["microsoft", "office365", "outlook"], official: ["microsoft.com", "live.com", "office.com", "outlook.com"] },
  { id: "google", names: ["Google", "Gmail"], tokens: ["google", "gmail"], official: ["google.com", "gmail.com", "youtube.com"] },
  { id: "netflix", names: ["Netflix"], tokens: ["netflix"], official: ["netflix.com"] },
  { id: "disney", names: ["Disney+"], tokens: ["disneyplus"], official: ["disneyplus.com"] },
  { id: "spotify", names: ["Spotify"], tokens: ["spotify"], official: ["spotify.com"] },
  { id: "facebook", names: ["Facebook", "Meta"], tokens: ["facebook"], official: ["facebook.com", "meta.com"] },
  { id: "instagram", names: ["Instagram"], tokens: ["instagram"], official: ["instagram.com"] },
  { id: "whatsapp", names: ["WhatsApp"], tokens: ["whatsapp"], official: ["whatsapp.com"] },
  { id: "walmart", names: ["Walmart"], tokens: ["walmart"], official: ["walmart.com", "walmart.ca"] },
  { id: "costco", names: ["Costco"], tokens: ["costco"], official: ["costco.com", "costco.ca"] },
  { id: "bestbuy", names: ["Best Buy"], tokens: ["bestbuy"], official: ["bestbuy.com", "bestbuy.ca"] },
  { id: "ebay", names: ["eBay"], tokens: ["ebay"], official: ["ebay.com", "ebay.ca"] },
  { id: "geeksquad", names: ["Geek Squad"], tokens: ["geeksquad"], official: ["geeksquad.com", "bestbuy.com"] },
];

export const BAIT_WORDS = ["bill", "billing", "pay", "payment", "verify", "verification", "secure", "security", "account", "login", "signin", "update", "support", "refund", "service", "confirm", "help", "portal", "auth", "wallet", "invoice", "unlock", "alert"];

export const ALL_OFFICIAL = new Set(BRANDS.flatMap((b) => b.official));

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\&-]/g, "\\$&");
}

const NAME_RES = BRANDS.map((b) => ({
  b,
  // Short all-caps names (TD, UPS, CRA, BMO, RBC) are matched case-sensitively to avoid "td" in words.
  res: b.names.map((n) => new RegExp(`(^|[^A-Za-z0-9])${esc(n)}(?![A-Za-z0-9])`, n.length <= 4 && n === n.toUpperCase() ? "" : "i")),
}));

export function brandsMentioned(text: string): Brand[] {
  return NAME_RES.filter(({ res }) => res.some((r) => r.test(text))).map(({ b }) => b);
}

/**
 * Finds a brand whose token appears inside a (non-official) registrable domain.
 * Long tokens (>=5 chars) match as substrings ("myfreedom-bill" ⊃ "freedom").
 * Short tokens must be a whole hyphen-part, or "my"+token, or token joined with a bait word.
 */
export function brandInDomain(registrable: string, subdomain = ""): Brand | null {
  const name = registrable.split(".")[0].toLowerCase();
  const parts = name.split(/[-_]/).concat(subdomain.toLowerCase().split(/[.\-_]/).filter(Boolean));
  const compact = name.replace(/[-_]/g, "");
  const leet = compact.replace(/0/g, "o").replace(/1/g, "l").replace(/3/g, "e").replace(/5/g, "s").replace(/rn/g, "m").replace(/vv/g, "w");
  for (const b of BRANDS) {
    if (b.official.includes(registrable)) continue;
    for (const t of b.tokens.map((x) => x.replace(/-/g, ""))) {
      if (t.length >= 5 && (compact.includes(t) || leet.includes(t) || parts.some((p) => p.includes(t)))) return b;
      if (parts.some((p) => p === t || p === "my" + t || BAIT_WORDS.some((w) => p === t + w || p === w + t))) return b;
    }
  }
  return null;
}

export function hasBaitHyphen(registrable: string): string | null {
  const name = registrable.split(".")[0].toLowerCase();
  if (!name.includes("-")) return null;
  const parts = name.split("-");
  return parts.find((p) => BAIT_WORDS.includes(p)) ?? null;
}
