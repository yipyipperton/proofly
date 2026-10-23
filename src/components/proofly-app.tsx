"use client";

import * as React from "react";
import {
  AlertTriangle, Check, ClipboardCopy, Info, Link2Off, Loader2, MessageSquare, Mail,
  Briefcase, ShoppingBag, ShieldCheck, ShieldAlert, Shield, RotateCcw, ListChecks, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORIES, CATEGORY_LABELS, MAX_TEXT, MIN_TEXT, type AnalysisResult, type Category } from "@/lib/schema";
import { DEMOS } from "@/lib/demos";
import { formatFindings } from "@/lib/format";

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
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-xl font-semibold tracking-tight">Proofly</p>
            <p className="text-xs text-muted-foreground">Check a message before you trust it</p>
          </div>
        </div>
        {(text || result) && (
          <Button variant="ghost" size="sm" onClick={reset} aria-label="Start over">
            <RotateCcw /> New check
          </Button>
        )}
      </header>

      <Card className="animate-rise">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <p id="cat-label" className="mb-2 text-sm font-medium">What kind of message is it?</p>
            <div role="radiogroup" aria-labelledby="cat-label" className="grid grid-cols-4 gap-1.5 rounded-xl bg-muted p-1">
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
                      "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium transition-all sm:flex-row sm:justify-center sm:gap-1.5 sm:text-xs",
                      active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {CATEGORY_LABELS[c]}
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
              className="min-h-[200px] resize-y sm:min-h-[240px]"
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
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => loadDemo(d.id)}
                  className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
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

          <Button size="lg" className="relative w-full overflow-hidden" disabled={!canSubmit} onClick={analyze}>
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

      <div ref={resultRef} className="scroll-mt-4">
        {result && <Results key={result.analyzedAt} result={result} />}
      </div>

      <footer className="mt-10 space-y-2 text-center text-xs leading-relaxed text-muted-foreground">
        <p>
          Proofly gives advisory guidance only and can&apos;t guarantee whether a message is safe or a scam.
          It never opens links and makes no domain reputation or threat-intelligence lookups.
        </p>
        <p>If you&apos;ve lost money or shared details, contact your bank right away using the number on your card.</p>
      </footer>
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
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", className)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-semibold tabular-nums">{score}</span>
      </div>
    </div>
  );
}

function Results({ result }: { result: AnalysisResult }) {
  const meta = RISK_META[result.riskLevel];
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    const t = formatFindings(result);
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{result.summary}</p>
          <Button variant="outline" className="mt-4 w-full sm:w-auto" onClick={copy}>
            {copied ? <Check className="text-emerald-600" /> : <ClipboardCopy />}
            {copied ? "Copied" : "Copy findings"}
          </Button>
        </CardContent>
      </Card>

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
              {result.concerns.map((c, i) => (
                <li key={i} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{c.title}</p>
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
                          <span className="break-words [overflow-wrap:anywhere]">{e}</span>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {result.urls.length > 0 && (
        <Card className="animate-rise [animation-delay:140ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2Off className="size-4" /> Links found</CardTitle>
            <CardDescription>Shown as plain text. Proofly did not open them or check any reputation service.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.urls.map((u, i) => (
                <li key={i} className="rounded-xl border border-border p-3">
                  {/* Inert text: deliberately not an <a> element */}
                  <code className="block select-all break-all font-mono text-[13px] text-foreground">{u.raw}</code>
                  {u.issues.length ? (
                    <ul className="mt-2 space-y-1">
                      {u.issues.map((iss, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-amber-800">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0" /> {iss}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">No structural warning signs. That doesn&apos;t make it safe.</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="animate-rise [animation-delay:200ms]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks className="size-4" /> How to verify</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {result.verificationSteps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="animate-rise bg-muted/60 [animation-delay:260ms]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Info className="size-4" /> What this check can&apos;t tell you</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {result.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
