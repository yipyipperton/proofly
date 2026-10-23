import { NextResponse } from "next/server";
import { getIntel } from "@/lib/intel/store";
import { intelInfo } from "@/lib/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const intel = await getIntel();
  return NextResponse.json({ ...intelInfo(intel), sources: intel.sources });
}
