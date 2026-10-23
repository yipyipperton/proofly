import { brandsIn, luresInAlert } from "./lures";

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  /** Only keep items whose title/summary look scam-related (for general news feeds). */
  requireScamKeyword: boolean;
}

export const SOURCES: FeedSource[] = [
  { id: "ftc", name: "FTC Consumer Alerts (US)", url: "https://consumer.ftc.gov/blog/gd-rss.xml", requireScamKeyword: false },
  { id: "ic3", name: "FBI IC3 Public Service Announcements (US)", url: "https://www.ic3.gov/PSA/RSS", requireScamKeyword: true },
  { id: "competition-bureau", name: "Competition Bureau Canada", url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=competitionbureau&sort=publishedDate&orderBy=desc&pick=100&format=atom", requireScamKeyword: true },
  { id: "rcmp", name: "RCMP (Canada)", url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=royalcanadianmountedpolice&sort=publishedDate&orderBy=desc&pick=100&format=atom", requireScamKeyword: true },
  { id: "cafc", name: "Canadian Anti-Fraud Centre", url: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=canadianantifraudcentre&sort=publishedDate&orderBy=desc&pick=50&format=atom", requireScamKeyword: false },
];

export interface FeedItem {
  title: string;
  link: string;
  date: string | null;
  summary: string;
}

export interface ScamAlert {
  sourceId: string;
  source: string;
  title: string;
  url: string;
  date: string | null;
  lures: string[];
  brands: string[];
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", mdash: "—", ndash: "–", hellip: "…" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Plain text only: strips CDATA, tags, decodes entities, collapses whitespace. */
export function toPlainText(s: string): string {
  const noCdata = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  // decode first so escaped HTML (&lt;p&gt;) is also stripped
  return decodeEntities(decodeEntities(noCdata).replace(/<[^>]*>/g, " ")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

function safeHttpUrl(u: string): string | null {
  try {
    const url = new URL(u.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isoDate(s: string | null): string | null {
  if (!s) return null;
  const d = new Date(toPlainText(s));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Parses RSS 2.0 or Atom XML into items. Pure string parsing; tolerant of junk. */
export function parseFeed(xml: string): FeedItem[] {
  if (typeof xml !== "string" || !/<(rss|feed|rdf:RDF)[\s>]/i.test(xml)) return [];
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  for (const b of blocks.slice(0, 200)) {
    const title = toPlainText(tag(b, "title") ?? "");
    let link = tag(b, "link");
    if (!link || !link.trim()) {
      const href = b.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : tag(b, "id") ?? tag(b, "guid") ?? "";
    }
    const url = safeHttpUrl(decodeEntities(toPlainText(link)));
    if (!title || !url) continue;
    const summary = toPlainText(tag(b, "description") ?? tag(b, "summary") ?? tag(b, "content") ?? "").slice(0, 1000);
    const date = isoDate(tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date"));
    items.push({ title: title.slice(0, 300), link: url, date, summary });
  }
  return items;
}

/** Alert links are only kept if they point at an official source domain. */
export const TRUSTED_HOSTS = ["ftc.gov", "ic3.gov", "canada.ca", "gc.ca", "antifraudcentre-centreantifraude.ca", "rcmp.ca"];

export function isTrustedUrl(u: string): boolean {
  try {
    const url = new URL(u);
    const h = url.hostname.toLowerCase();
    return url.protocol === "https:" && TRUSTED_HOSTS.some((t) => h === t || h.endsWith("." + t));
  } catch {
    return false;
  }
}

const SCAM_WORD = /\b(scam\w*|fraud\w*|phishing|impersonat\w*|imposter|deceptive|extortion|sextortion|swindl\w*)\b/i;

export function itemsToAlerts(source: FeedSource, items: FeedItem[]): ScamAlert[] {
  const out: ScamAlert[] = [];
  for (const it of items) {
    const hay = `${it.title}. ${it.summary}`;
    if (source.requireScamKeyword && !SCAM_WORD.test(hay)) continue;
    if (!isTrustedUrl(it.link)) continue;
    const lures = luresInAlert(hay);
    // Only alerts we can classify deterministically are kept; we never guess.
    if (!lures.length) continue;
    out.push({ sourceId: source.id, source: source.name, title: it.title, url: it.link, date: it.date, lures, brands: brandsIn(hay) });
  }
  return out;
}

export interface SourceStatus {
  id: string;
  name: string;
  ok: boolean;
  items: number;
  alerts: number;
  error?: string;
}

export interface ScamIntel {
  updatedAt: string | null;
  sources: SourceStatus[];
  alerts: ScamAlert[];
}

export async function fetchSource(
  source: FeedSource,
  fetchImpl: typeof fetch = fetch,
  init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {},
  timeoutMs = 8000,
): Promise<{ status: SourceStatus; alerts: ScamAlert[] }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(source.url, {
      ...init,
      signal: controller.signal,
      headers: { "User-Agent": "Proofly/1.0 (+https://github.com/yipyipperton/proofly)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseFeed(xml);
    if (!items.length) throw new Error("No feed items found");
    const alerts = itemsToAlerts(source, items);
    return { status: { id: source.id, name: source.name, ok: true, items: items.length, alerts: alerts.length }, alerts };
  } catch (e) {
    const msg = e instanceof Error ? (e.name === "AbortError" ? "Timed out" : e.message) : "Failed";
    return { status: { id: source.id, name: source.name, ok: false, items: 0, alerts: 0, error: msg }, alerts: [] };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetches all sources. For any source that fails, alerts from the previous snapshot are kept,
 * so a failed fetch never removes known patterns.
 */
export async function buildIntel(
  previous: ScamIntel | null,
  fetchImpl: typeof fetch = fetch,
  init: Parameters<typeof fetchSource>[2] = {},
): Promise<ScamIntel> {
  const results = await Promise.all(SOURCES.map((s) => fetchSource(s, fetchImpl, init)));
  const alerts: ScamAlert[] = [];
  const anyOk = results.some((r) => r.status.ok);
  for (const r of results) {
    if (r.status.ok) alerts.push(...r.alerts);
    else if (previous) alerts.push(...previous.alerts.filter((a) => a.sourceId === r.status.id));
  }
  const seen = new Set<string>();
  const deduped = alerts.filter((a) => (seen.has(a.url) ? false : (seen.add(a.url), true)));
  deduped.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return {
    updatedAt: anyOk ? new Date().toISOString() : previous?.updatedAt ?? null,
    sources: results.map((r) => r.status),
    alerts: deduped.slice(0, 400),
  };
}
