"use client";

import * as React from "react";
import {
  AlertTriangle, Check, ClipboardCopy, Info, Link2Off, Loader2, MessageSquare, Mail,
  Briefcase, ShoppingBag, ShieldCheck, ShieldAlert, Shield, RotateCcw, ListChecks, Quote, Radar, ExternalLink, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABELS, MAX_TEXT, MIN_TEXT, type AnalysisResult, type Category, type IntelInfo } from "@/lib/schema";
import { DEMOS } from "@/lib/demos";
import { formatFindings } from "@/lib/format";

async function copyText(t: string) {
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "unknown" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function IntelStatus({ info }: { info: IntelInfo | null | "loading" }) {
  if (info === "loading") return <p className="text-xs text-muted-foreground">Loading scam pattern library…</p>;
  if (!info) return <p className="text-xs text-muted-foreground">Scam pattern library unavailable. Rules still apply.</p>;
  const ok = info.sources.filter((s) => s.ok).map((s) => s.name);
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Radar className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Scam patterns last updated: <span className="font-medium text-foreground">{fmtDate(info.updatedAt)}</span> · {info.alertCount} public alerts
        {ok.length ? ` from ${ok.join(", ")}` : " (using saved snapshot)"}
      </span>
    </p>
  );
}

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  sms: MessageSquare, email: Mail, job: Briefcase, marketplace: ShoppingBag,
};

export function ProoflyApp() {
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState<Category>("sms");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);
  const [intel, setIntel] = React.useState<IntelInfo | null | "loading">("loading");

  React.useEffect(() => {
    let alive = true;
    fetch("/api/intel")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setIntel(d && typeof d.alertCount === "number" ? d : null))
      .catch(() => alive && setIntel(null));
    return () => {
      alive = false;
    };
  }, []);

  const [copied, setCopied] = React.useState(false);
  async function copyFindings() {
    if (!result) return;
    await copyText(formatFindings(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const len = text.trim().length;
  const canSubmit = len >= MIN_TEXT && text.length <= MAX_TEXT && !loading;

  async function analyze() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data && typeof data.error === "string" && data.error) || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as AnalysisResult);
      (document.activeElement as HTMLElement | null)?.blur?.(); // close mobile keyboard
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }), 60);
    } catch {
      setError("Couldn't reach Proofly. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadDemo(id: string) {
    const d = DEMOS.find((x) => x.id === id);
    if (!d) return;
    setText(d.text);
    setCategory(d.category);
    setResult(null);
    setError(null);
  }

  function reset() {
    setText("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-16 sm:pt-8">
      <header className="mb-4 flex min-h-11 items-center justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="font-serif text-xl font-semibold tracking-tight">Proofly</h1>
            <p className="truncate text-xs text-muted-foreground">Check a message before you trust it</p>
          </div>
        </div>
        {(text || result) && (
          <Button variant="ghost" size="sm" onClick={reset} aria-label="Start a new check" className="shrink-0">
            <RotateCcw /> <span className="hidden min-[380px]:inline">New check</span>
          </Button>
        )}
      </header>

      <Card className="animate-rise">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <p id="cat-label" className="mb-2 text-sm font-medium">What kind of message is it?</p>
            <div role="radiogroup" aria-labelledby="cat-label" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 min-[420px]:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c];
                const active = c === category;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-medium leading-tight transition-all min-[420px]:min-h-14 min-[420px]:flex-col min-[420px]:gap-1 min-[420px]:text-xs sm:min-h-11 sm:flex-row sm:gap-1.5",
                      active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="max-w-full truncate">{CATEGORY_LABELS[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="msg" className="mb-2 block text-sm font-medium">Paste the message</label>
            <Textarea
              id="msg"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Paste the full text here, including any links, phone numbers and sender details…"
              className="min-h-[170px] resize-y sm:min-h-[240px]"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Link2Off className="size-3.5" /> Links are never opened</span>
              <span className={cn(text.length > MAX_TEXT * 0.9 && "text-amber-700")}>
                {text.length.toLocaleString()} / {MAX_TEXT.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Or try an example</p>
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              {DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => loadDemo(d.id)}
                  className="min-h-11 shrink-0 snap-start rounded-full border border-border bg-card px-4 text-sm font-medium text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
            </div>
          )}

          <Button size="lg" className="relative hidden w-full overflow-hidden sm:flex" disabled={!canSubmit} onClick={analyze}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Checking for red flags…
                <span className="animate-scan pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </>
            ) : (
              <>
                <Shield /> Check this message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div ref={resultRef} className="scroll-mt-3">
        {result && <Results key={result.analyzedAt} result={result} copied={copied} onCopy={copyFindings} />}
      </div>

      <div className="mt-6 flex justify-center px-2"><IntelStatus info={result?.intel ?? intel} /></div>

      <footer className="mt-6 space-y-2 text-center text-xs leading-relaxed text-muted-foreground">
        <p>
          Proofly gives advisory guidance only and can&apos;t guarantee whether a message is safe or a scam.
          It never opens links in your message and makes no domain reputation lookups. Known-pattern matches come only from public government scam alerts.
        </p>
        <p>If you&apos;ve lost money or shared details, contact your bank right away using the number on your card.</p>
      </footer>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/85 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">
          {result && (
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={copyFindings} aria-label={copied ? "Findings copied" : "Copy findings"}>
              {copied ? <Check className="text-emerald-600" /> : <ClipboardCopy />}
            </Button>
          )}
          <Button size="lg" className="relative flex-1 overflow-hidden" disabled={!canSubmit} onClick={analyze}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Checking…
                <span className="animate-scan pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </>
            ) : (
              <>
                <Shield /> {len < MIN_TEXT ? "Paste a message to check" : result ? "Check again" : "Check message"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const RISK_META = {
  low: { label: "Low risk", icon: ShieldCheck, ring: "text-emerald-500", bg: "from-emerald-50", text: "text-emerald-800" },
  medium: { label: "Medium risk", icon: Shield, ring: "text-amber-500", bg: "from-amber-50", text: "text-amber-800" },
  high: { label: "High risk", icon: ShieldAlert, ring: "text-rose-500", bg: "from-rose-50", text: "text-rose-800" },
} as const;

function ScoreRing({ score, className }: { score: number; className: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-black/5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (shown / 100) * c}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none", className)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-semibold tabular-nums">{score}</span>
      </div>
    </div>
  );
}

function Results({ result, copied, onCopy }: { result: AnalysisResult; copied: boolean; onCopy: () => void }) {
  const meta = RISK_META[result.riskLevel];
  const [showAll, setShowAll] = React.useState(false);
  const concerns = showAll ? result.concerns : result.concerns.slice(0, 3);

  return (
    <section aria-live="polite" className="mt-6 space-y-4">
      <Card className={cn("animate-rise overflow-hidden bg-gradient-to-b to-card to-60%", meta.bg)}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={result.score} className={meta.ring} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("font-serif text-2xl font-semibold tracking-tight", meta.text)}>{meta.label}</h2>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="outline">{CATEGORY_LABELS[result.category]}</Badge>
                <Badge variant="outline">Rule-based check</Badge>
              </div>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed [overflow-wrap:anywhere] sm:text-base">{result.summary}</p>
          <Button variant="outline" className="mt-4 w-full sm:w-auto" onClick={onCopy}>
            {copied ? <Check className="text-emerald-600" /> : <ClipboardCopy />}
            {copied ? "Copied" : "Copy findings"}
          </Button>
        </CardContent>
      </Card>

      {result.intelMatches.length > 0 && (
        <Card className="animate-rise border-amber-200 [animation-delay:40ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Radar className="size-4 text-amber-600" /> Matches a reported scam pattern</CardTitle>
            <CardDescription>
              This message resembles scam types described in public alerts. A pattern match means the message is similar to a reported scam. It doesn&apos;t prove this message is one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.intelMatches.map((m) => (
              <div key={m.lure} className="rounded-xl border border-border p-4">
                <p className="font-medium">{m.label}</p>
                <ul className="mt-2 space-y-2">
                  {m.alerts.map((a, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-xs text-muted-foreground">{a.source} · {fmtDate(a.date)}{a.brandMatch ? " · same brand mentioned" : ""}</p>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 break-words py-1 font-medium text-primary underline-offset-2 [overflow-wrap:anywhere] hover:underline">
                        {a.title} <ExternalLink className="mt-1 size-3 shrink-0" />
                      </a>
                      <p className="break-all font-mono text-[11px] text-muted-foreground">{a.url}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="animate-rise [animation-delay:80ms]">
        <CardHeader>
          <CardTitle>Key concerns</CardTitle>
          <CardDescription>
            {result.concerns.length ? "Each concern is tied to words found in your message." : "No common red flags were detected."}
          </CardDescription>
        </CardHeader>
        {result.concerns.length > 0 && (
          <CardContent>
            <ul className="space-y-3">
              {concerns.map((c, i) => (
                <li key={i} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-medium leading-snug">{c.title}</p>
                    <div className="flex shrink-0 gap-1">
                      <Badge variant={c.severity}>{c.severity}</Badge>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.explanation}</p>
                  {c.evidence.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {c.evidence.map((e, j) => (
                        <blockquote key={j} className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                          <Quote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{e}</span>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {result.concerns.length > 3 && (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                {showAll ? "Show fewer" : `Show ${result.concerns.length - 3} more`}
                <ChevronDown className={cn("transition-transform", showAll && "rotate-180")} />
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {result.urls.length > 0 && (
        <Collapsible
          className="[animation-delay:140ms]"
          defaultOpen={result.urls.some((u) => u.issues.length > 0)}
          title={<><Link2Off className="size-4" /> Links found <Badge variant="outline">{result.urls.length}</Badge></>}
          description="Shown as plain text. Proofly did not open them or check any reputation service."
        >
          <ul className="space-y-2">
            {result.urls.map((u, i) => (
              <li key={i} className="rounded-xl border border-border p-3">
                {/* Inert text: deliberately not an <a> element */}
                <code className="block select-all break-all font-mono text-[13px] text-foreground">{u.raw}</code>
                {u.issues.length ? (
                  <ul className="mt-2 space-y-1">
                    {u.issues.map((iss, j) => (
                      <li key={j} className="flex items-start gap-1.5 break-words text-xs leading-relaxed text-amber-800 [overflow-wrap:anywhere]">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0" /> <span className="min-w-0">{iss}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">No structural warning signs. That doesn&apos;t make it safe.</p>
                )}
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      <Collapsible className="[animation-delay:200ms]" defaultOpen title={<><ListChecks className="size-4" /> How to verify</>}>
        <ol className="space-y-2.5">
          {result.verificationSteps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span>
              <span className="min-w-0 pt-0.5 break-words">{s}</span>
            </li>
          ))}
        </ol>
      </Collapsible>

      <Collapsible className="bg-muted/60 [animation-delay:260ms]" title={<><Info className="size-4" /> What this check can&apos;t tell you</>}>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {result.limitations.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </Collapsible>
    </section>
  );
}

function Collapsible({
  title, description, defaultOpen = false, className, children,
}: { title: React.ReactNode; description?: string; defaultOpen?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn("animate-rise overflow-hidden", className)}>
      <details open={defaultOpen} className="group">
        <summary className="flex min-h-14 cursor-pointer select-none items-center justify-between gap-3 p-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          <ChevronDown className="chev size-5 shrink-0 text-muted-foreground transition-transform" />
        </summary>
        <div className="px-5 pb-5">{children}</div>
      </details>
    </Card>
  );
}
