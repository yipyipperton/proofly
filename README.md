# Proofly

**Check a message before you trust it.** Proofly is a mobile-first consumer safety tool. Paste a suspicious SMS, email, job offer or marketplace conversation and you get a calm, plain-English assessment of its red flags.

> ⚠️ Proofly is **advisory only and not a guarantee**. A low score does not mean a message is safe. Proofly **never visits links** and makes **no domain reputation, blocklist, WHOIS or threat-intelligence lookups**. Everything it reports comes from the text you paste.

## Features

- Large paste box and a category selector (SMS, Email, Job offer, Marketplace)
- **URL extraction without visiting.** Links are parsed locally and shown as inert, non-clickable text.
- **Deterministic rules:**
  - URL structure: IP hosts, punycode (`xn--`), brand-in-subdomain and look-alike domains, shorteners, many subdomains, `@` in the URL, unusual TLDs, `http://`
  - Urgent or irreversible payment requests: gift cards, wire, crypto, Zelle/Venmo/Cash App
  - Requests for credentials, OTP codes or SSN/SIN
  - Impersonation of banks, USPS/FedEx, IRS/CRA, Amazon, PayPal and similar
  - Job-specific: upfront fees, check cashing, chat-app interviews
  - Marketplace-specific: overpayment, moving off-platform, shipping-only or "my mover", "prove you're real" codes
- **Structured AI explanation** from any OpenAI-compatible API. The output is JSON validated with Zod, and AI evidence quotes are checked against the pasted text (made-up quotes are dropped). The AI can raise the rule-based risk but never lower it.
- Risk level (low/medium/high) with a 0–100 score, key concerns tied to evidence quotes, limitations and verification steps
- One-click **Copy findings** as plain text (links are defanged as `example[.]com`)
- Three preloaded demo examples
- **Safe demo mode** when no API key is set: rule-based analysis with templated explanations, clearly labelled
- **Graceful AI failure.** Timeouts, HTTP errors, malformed JSON and schema mismatches fall back to rule-only results with a notice.
- Zod input validation (10–8,000 chars, enum category), in-memory per-IP rate limiting (10 req/min)
- User text is never rendered as HTML (React text nodes only, no `dangerouslySetInnerHTML`). The pasted message is passed to the model as delimited untrusted data.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui-style components (`components.json`, Radix Slot, CVA) · Zod · Vitest · lucide-react

## Setup

```bash
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY
npm run dev                  # http://localhost:3000
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest unit tests (URL parsing, validation, rules, AI response handling, rate limiter) |
| `npm run lint` | ESLint |

## Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | No | none | Server-side only. If missing, the app runs in demo mode. |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Any OpenAI-compatible `/chat/completions` endpoint |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Must support `response_format: json_object` |

Keys are read only in the `/api/analyze` route handler (`src/lib/ai.ts` imports `server-only`). Nothing is exposed with `NEXT_PUBLIC_`.

## Deploy to Vercel

1. Push this repo to GitHub (done: `yipyipperton/proofly`).
2. Go to <https://vercel.com/new>, import the repo, and keep the defaults (Framework: Next.js; build command `next build`).
3. Under **Settings → Environment Variables**, add `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL` and `OPENAI_MODEL`). Skip this step to deploy in demo mode.
4. Click **Deploy**. To deploy from the CLI instead, run `npx vercel` then `npx vercel --prod`, and add env vars with `npx vercel env add OPENAI_API_KEY`.

The API route runs on the Node.js runtime with a 20s AI timeout.

## Rate limiting: serverless caveat

The rate limiter (`src/lib/rate-limit.ts`) is an **in-memory, per-instance** fixed window. On Vercel and other serverless platforms, each function instance has its own memory, instances scale out and get recycled, and cold starts reset counters. That makes the limit **best-effort, not a hard limit**. For strict, global limits, use a shared store such as Upstash Redis / Vercel KV (e.g. `@upstash/ratelimit`) or Vercel Firewall rules. The client IP comes from `x-forwarded-for`, which Vercel sets.

## Project layout

```
src/app/page.tsx              App (product UI, no marketing page)
src/app/api/analyze/route.ts  Validation, rate limit, rules + AI, fallback
src/components/proofly-app.tsx Client UI
src/lib/urls.ts               URL extraction & structural analysis (no network)
src/lib/rules.ts              Deterministic rules & scoring
src/lib/ai.ts / ai-parse.ts   OpenAI-compatible call + Zod-validated parsing
src/lib/analyze.ts            Merges rules + AI, templated demo explanations
tests/                        Vitest suites
```

## Limitations

- Heuristic rules produce both false positives and false negatives. Scams evolve.
- No sender, header, attachment, link-destination, or reputation verification is performed.
- AI explanations can be wrong. They are grounded to quotes from the message, but you should still treat them as guidance only.

If you've lost money or shared credentials, contact your bank using the number on your card and report it to [reportfraud.ftc.gov](https://reportfraud.ftc.gov) (US) or the Canadian Anti-Fraud Centre.
