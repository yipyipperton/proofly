import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getIntel, INTEL_TAG } from "@/lib/intel/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Daily Vercel Cron: invalidates cached feeds and refetches them. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag(INTEL_TAG);
  const intel = await getIntel({ force: true });
  return NextResponse.json({ updatedAt: intel.updatedAt, alerts: intel.alerts.length, sources: intel.sources });
}
