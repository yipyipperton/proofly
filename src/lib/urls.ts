import type { ExtractedUrl } from "./schema";

/**
 * Extracts URL-like strings from text. URLs are NEVER fetched or visited.
 * This is pure, local string parsing only.
 */
const URL_RE =
  /\b((?:https?:\/\/|hxxps?:\/\/|www\.)[^\s<>"'`]+|(?:[a-z0-9-]+\.)+(?:[a-z]{2,24}|xn--[a-z0-9-]+)\/[^\s<>"'`]*|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|info|biz|xyz|top|click|link|me|ly|gl|gd|app|site|online|shop|live|support|help|us|ca|uk)\b)/gi;

export const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly",
  "cutt.ly", "shorturl.at", "rb.gy", "t.ly", "tiny.cc", "s.id", "lnkd.in", "bl.ink", "v.gd",
]);

export const UNUSUAL_TLDS = new Set([
  "xyz", "top", "click", "link", "zip", "mov", "work", "support", "help", "live", "online",
  "site", "icu", "buzz", "rest", "cam", "gq", "tk", "ml", "cf", "ga", "loan", "win", "bid",
  "monster", "cyou", "sbs", "lol", "quest", "shop",
]);

import { ALL_OFFICIAL, brandInDomain, hasBaitHyphen } from "./brands";

export function extractUrls(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(URL_RE)) {
    const idx = m.index ?? 0;
    // skip the domain part of email addresses
    if (idx > 0 && text[idx - 1] === "@") continue;
    const raw = m[0].replace(/[),.;:!?\]]+$/, "").slice(0, 500);
    if (raw.length < 4) continue;
    const key = raw.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(raw);
    }
  }
  return out;
}

export function parseHost(raw: string): string | null {
  let s = raw.trim().replace(/^hxxp/i, "http");
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  try {
    // WHATWG URL parsing is purely local; no network access occurs.
    const u = new URL(s);
    return u.hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function registrableDomain(host: string): string {
  const parts = host.split(".");
  if (
    parts.length >= 3 &&
    /^(co|com|org|gov|ac|net)$/.test(parts[parts.length - 2]) &&
    parts[parts.length - 1].length === 2
  ) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

export function analyzeUrl(raw: string): ExtractedUrl {
  const issues: string[] = [];
  const host = parseHost(raw);
  const lower = raw.toLowerCase();

  if (/^http:\/\//i.test(raw)) issues.push("Uses unencrypted http:// instead of https://");
  if (/^hxxps?:\/\//i.test(raw)) issues.push("Defanged link (hxxp) — treat as untrusted");

  const afterScheme = lower.replace(/^[a-z]+:\/\//, "");
  const authority = afterScheme.split(/[/?#]/)[0];
  if (authority.includes("@")) {
    issues.push("Contains '@' before the host, which can disguise the real destination");
  }

  if (!host) {
    issues.push("Could not parse this link");
    return { raw, host, issues };
  }

  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (isIp) issues.push("Host is a raw IP address instead of a domain name");

  const labels = host.split(".");
  if (labels.some((l) => l.startsWith("xn--"))) {
    issues.push("Punycode (xn--) domain that may imitate another domain with look-alike characters");
  }
  if (isIp) return { raw, host, issues };

  const reg = registrableDomain(host);
  if (URL_SHORTENERS.has(host) || URL_SHORTENERS.has(reg)) {
    issues.push("URL shortener hides the final destination");
  }
  if (labels.length >= 5) issues.push(`Unusually many subdomains (${labels.length - 2})`);
  const tld = labels[labels.length - 1];
  if (UNUSUAL_TLDS.has(tld)) issues.push(`Uncommon top-level domain ".${tld}" often used for throwaway sites`);

  const sub = host.slice(0, Math.max(0, host.length - reg.length)).replace(/\.$/, "");
  if (!ALL_OFFICIAL.has(reg)) {
    const brand = brandInDomain(reg, sub.replace(/^www\.?/, ""));
    if (brand) {
      issues.push(`Look-alike domain: "${reg}" uses the name "${brand.names[0]}" but is not an official ${brand.names[0]} domain (${brand.official[0]})`);
    }
    const bait = hasBaitHyphen(reg);
    if (bait) issues.push(`Hyphenated domain with the bait word "${bait}", a pattern common in phishing sites`);
  }
  return { raw, host, issues };
}

export function extractAndAnalyzeUrls(text: string): ExtractedUrl[] {
  return extractUrls(text).slice(0, 25).map(analyzeUrl);
}
