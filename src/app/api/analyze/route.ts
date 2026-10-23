import { NextResponse } from "next/server";
import { AnalyzeInputSchema } from "@/lib/schema";
import { buildResult } from "@/lib/analyze";
import { getIntel } from "@/lib/intel/store";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort per-instance limiter: 20 requests / minute / IP.
const limiter = createRateLimiter(20, 60_000);

export async function POST(req: Request) {
  const rl = limiter(clientIp(req.headers));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checks in a short time. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 64_000) return NextResponse.json({ error: "Request too large." }, { status: 413 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = AnalyzeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const intel = await getIntel().catch(() => null);
  return NextResponse.json(buildResult({ ...parsed.data, intel }));
}
