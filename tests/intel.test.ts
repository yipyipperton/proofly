import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { buildIntel, itemsToAlerts, parseFeed, SOURCES, toPlainText, type ScamIntel } from "@/lib/intel/feeds";
import { luresInMessage } from "@/lib/intel/lures";
import { matchIntel } from "@/lib/intel/match";
import { buildResult } from "@/lib/analyze";

const fx = (f: string) => readFileSync(path.join(import.meta.dirname, "fixtures", f), "utf8");
const ftc = SOURCES.find((s) => s.id === "ftc")!;
const cb = SOURCES.find((s) => s.id === "competition-bureau")!;

describe("parseFeed", () => {
  it("parses RSS items with entities, CDATA and HTML stripped", () => {
    const items = parseFeed(fx("ftc-rss.xml"));
    expect(items.map((i) => i.title)).toContain("Got a text about unpaid tolls? It's a scam");
    const first = items[0];
    expect(first.summary).toBe("Scammers are impersonating the FTC & saying they’ll deactivate your phone number unless you pay.");
    expect(first.summary).not.toMatch(/[<>]/);
    expect(first.date).toBe("2026-10-22T14:00:00.000Z");
  });
  it("drops non-http links", () => {
    expect(parseFeed(fx("ftc-rss.xml")).some((i) => i.link.startsWith("javascript"))).toBe(false);
  });
  it("parses Atom entries with href links", () => {
    const items = parseFeed(fx("gc-atom.xml"));
    expect(items).toHaveLength(2);
    expect(items[0].link).toBe("https://www.canada.ca/en/competition-bureau/news/2026/07/passport.html");
  });
  it("returns [] for junk / HTML error pages", () => {
    expect(parseFeed("<html><body>404</body></html>")).toEqual([]);
    expect(parseFeed("")).toEqual([]);
  });
  it("toPlainText strips escaped html", () => {
    expect(toPlainText("&lt;script&gt;x&lt;/script&gt; hi")).toBe("x hi");
  });
});

describe("itemsToAlerts", () => {
  it("classifies lures, extracts brands, ignores untrusted hosts and unclassifiable items", () => {
    const alerts = itemsToAlerts(ftc, parseFeed(fx("ftc-rss.xml")));
    expect(alerts.map((a) => a.title)).toEqual([
      "The FTC is not calling to deactivate your phone number",
      "Got a text about unpaid tolls? It's a scam",
    ]);
    expect(alerts[0].lures).toEqual(expect.arrayContaining(["phone-deactivation", "government"]));
    expect(alerts[0].brands).toContain("FTC");
    expect(alerts[1].lures).toContain("toll");
    expect(alerts[1].brands).toContain("E-ZPass");
  });
  it("requires a scam keyword for general news feeds", () => {
    const alerts = itemsToAlerts(cb, parseFeed(fx("gc-atom.xml")));
    expect(alerts.map((a) => a.title)).toEqual(["Multiple charges laid in deceptive online passport service scam"]);
  });
});

describe("buildIntel", () => {
  it("uses previous snapshot for failed sources and never invents alerts", async () => {
    const previous: ScamIntel = {
      updatedAt: "2026-01-01T00:00:00.000Z",
      sources: [],
      alerts: [{ sourceId: "ic3", source: "IC3", title: "Old IC3 alert", url: "https://www.ic3.gov/PSA/x", date: null, lures: ["job"], brands: [] }],
    };
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes("ftc.gov") ? new Response(fx("ftc-rss.xml")) : new Response("nope", { status: 500 }),
    ) as unknown as typeof fetch;
    const intel = await buildIntel(previous, fetchImpl);
    expect(intel.sources.find((s) => s.id === "ftc")?.ok).toBe(true);
    expect(intel.sources.find((s) => s.id === "ic3")?.ok).toBe(false);
    expect(intel.alerts.map((a) => a.title).sort()).toEqual(
      ["Got a text about unpaid tolls? It's a scam", "Old IC3 alert", "The FTC is not calling to deactivate your phone number"].sort(),
    );
    expect(intel.updatedAt).not.toBe(previous.updatedAt);
  });
  it("keeps previous updatedAt when every source fails", async () => {
    const fetchImpl = vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    const intel = await buildIntel({ updatedAt: "2026-01-01T00:00:00.000Z", sources: [], alerts: [] }, fetchImpl);
    expect(intel.updatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(intel.sources.every((s) => !s.ok)).toBe(true);
  });
});

describe("matching", () => {
  const intel: ScamIntel = { updatedAt: "2026-10-22T00:00:00.000Z", sources: [], alerts: itemsToAlerts(ftc, parseFeed(fx("ftc-rss.xml"))) };

  it("detects lures in messages", () => {
    expect(luresInMessage("E-ZPass: You have an unpaid toll balance of $4.15")).toContain("toll");
    expect(luresInMessage("See you at dinner")).toEqual([]);
  });
  it("matches a toll text to the real FTC toll alert", () => {
    const m = matchIntel("E-ZPass notice: unpaid toll balance $6.99. Pay now at http://ezpass-pay.xyz", intel);
    expect(m).toHaveLength(1);
    expect(m[0].lure).toBe("toll");
    expect(m[0].alerts[0]).toMatchObject({ title: "Got a text about unpaid tolls? It's a scam", brandMatch: true });
    expect(m[0].alerts[0].url).toMatch(/^https:\/\/consumer\.ftc\.gov\//);
  });
  it("returns nothing when no alert supports the lure", () => {
    expect(matchIntel("Congratulations you won a prize, pay the claim fee", intel)).toEqual([]);
    expect(matchIntel("unpaid toll balance", null)).toEqual([]);
    expect(matchIntel("unpaid toll balance", { updatedAt: null, sources: [], alerts: [] })).toEqual([]);
  });
  it("buildResult includes matches, raises score, and reports update date", () => {
    const text = "E-ZPass: unpaid toll balance of $6.99 must be paid within 24 hours: http://ezpass-pay.xyz/pay";
    const without = buildResult({ text, category: "sms" });
    const withIntel = buildResult({ text, category: "sms", intel });
    expect(withIntel.intelMatches).toHaveLength(1);
    expect(withIntel.score).toBeGreaterThan(without.score);
    expect(withIntel.summary).toMatch(/publicly reported by FTC/);
    expect(withIntel.intel?.updatedAt).toBe("2026-10-22T00:00:00.000Z");
    expect(without.intelMatches).toEqual([]);
  });
  it("a benign message gets no intel score boost", () => {
    const r = buildResult({ text: "Hi! Want to grab tickets for the game Saturday?", category: "sms", intel });
    expect(r.score).toBe(0);
  });
});
