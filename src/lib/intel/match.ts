import type { ScamAlert, ScamIntel } from "./feeds";
import { brandsIn, LURE_LABELS, luresInMessage } from "./lures";

export interface IntelMatch {
  lure: string;
  label: string;
  alerts: Array<Pick<ScamAlert, "source" | "title" | "url" | "date"> & { brandMatch: boolean }>;
}

/**
 * A match is reported ONLY when the pasted message shows a lure type AND at least one real
 * alert from a public source was classified with the same lure. Nothing is invented.
 */
export function matchIntel(text: string, intel: ScamIntel | null, maxPerLure = 3): IntelMatch[] {
  if (!intel || !intel.alerts.length) return [];
  const lures = luresInMessage(text);
  const brands = new Set(brandsIn(text).map((b) => b.toLowerCase()));
  const out: IntelMatch[] = [];
  for (const lure of lures) {
    const related = intel.alerts
      .filter((a) => a.lures.includes(lure))
      .map((a) => ({ a, brandMatch: a.brands.some((b) => brands.has(b.toLowerCase())) }))
      .sort((x, y) => Number(y.brandMatch) - Number(x.brandMatch) || (y.a.date ?? "").localeCompare(x.a.date ?? ""))
      .slice(0, maxPerLure);
    if (related.length) {
      out.push({
        lure,
        label: LURE_LABELS[lure] ?? lure,
        alerts: related.map(({ a, brandMatch }) => ({ source: a.source, title: a.title, url: a.url, date: a.date, brandMatch })),
      });
    }
  }
  return out;
}
