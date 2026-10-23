import snapshot from "@/data/scam-intel.json";
import { buildIntel, type ScamIntel } from "./feeds";

export const INTEL_TAG = "scam-feeds";
const MEMORY_TTL_MS = 6 * 60 * 60 * 1000;

const SNAPSHOT = snapshot as ScamIntel;
let cache: { intel: ScamIntel; at: number } | null = null;
let inflight: Promise<ScamIntel> | null = null;

/**
 * Returns scam intelligence. Order of preference:
 *  1. in-memory copy (per serverless instance, 6h)
 *  2. live feeds via Next.js Data Cache (shared on Vercel, revalidated daily and by the cron job)
 *  3. the committed snapshot (src/data/scam-intel.json) for any source that fails
 */
export async function getIntel(opts: { force?: boolean } = {}): Promise<ScamIntel> {
  if (!opts.force && cache && Date.now() - cache.at < MEMORY_TTL_MS) return cache.intel;
  if (!inflight) {
    inflight = buildIntel(SNAPSHOT, fetch, { next: { revalidate: 86400, tags: [INTEL_TAG] } })
      .then((intel) => {
        const usable = intel.alerts.length ? intel : SNAPSHOT;
        cache = { intel: usable, at: Date.now() };
        return usable;
      })
      .catch(() => SNAPSHOT)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function snapshotIntel(): ScamIntel {
  return SNAPSHOT;
}
