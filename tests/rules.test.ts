import { describe, expect, it } from "vitest";
import { analyzeWithRules, runRules } from "@/lib/rules";
import { DEMOS } from "@/lib/demos";
import { buildResult, templatedSummary, defaultSteps } from "@/lib/analyze";
import { formatFindings } from "@/lib/format";

const ids = (t: string, c: Parameters<typeof runRules>[1] = "sms") => runRules(t, c).map((f) => f.id);

describe("rule detections", () => {
  it("gift cards", () => expect(ids("Buy 3 Google Play gift cards and send the codes")).toContain("payment-giftcard"));
  it("wire/crypto/zelle", () => {
    expect(ids("Send it by Zelle today")).toContain("payment-irreversible");
    expect(ids("pay with bitcoin at the ATM")).toContain("payment-irreversible");
    expect(ids("please wire transfer the fee")).toContain("payment-irreversible");
  });
  it("credentials / OTP / SSN", () => {
    expect(ids("Reply with the verification code we sent")).toContain("credentials");
    expect(ids("Please provide your SSN")).toContain("credentials");
  });
  it("urgency", () => expect(ids("Your account will be suspended immediately")).toContain("urgency"));
  it("impersonation", () => expect(ids("This is the IRS calling about your taxes")).toContain("impersonation"));
  it("job: upfront payment and check cashing", () => {
    const r = ids("You must pay for the training kit. Then deposit the check and send the remaining balance to the vendor.", "job");
    expect(r).toContain("job-upfront");
    expect(r).toContain("check-cashing");
  });
  it("marketplace: overpay, off-platform, shipping", () => {
    const r = ids("I will pay more than asking, refund the difference. My mover will pick it up. Text me on WhatsApp.", "marketplace");
    expect(r).toEqual(expect.arrayContaining(["mkt-overpay", "mkt-shipping", "off-platform"]));
  });
  it("category-specific rules don't fire in other categories", () => {
    expect(ids("refund the difference", "sms")).not.toContain("mkt-overpay");
  });
  it("benign message scores low", () => {
    const r = analyzeWithRules("Hey, are we still on for dinner Thursday at 7? Let me know!", "sms");
    expect(r.riskLevel).toBe("low");
    expect(r.ruleFindings).toEqual([]);
  });
  it("all demos are high risk", () => {
    for (const d of DEMOS) expect(analyzeWithRules(d.text, d.category).riskLevel).toBe("high");
  });
  it("evidence quotes come from the text", () => {
    const t = "Final notice: buy gift cards now";
    for (const f of runRules(t, "sms")) for (const e of f.evidence) expect(t).toContain(e.replace(/…/g, "").trim());
  });
});

describe("buildResult and explanations", () => {
  it("produces a full result with explanations and disclaimers", () => {
    const r = buildResult({ text: DEMOS[0].text, category: "sms" });
    expect(r.riskLevel).toBe("high");
    expect(r.summary).toMatch(/strong warning signs/);
    expect(r.concerns.length).toBeGreaterThan(0);
    for (const c of r.concerns) {
      expect(c.explanation.length).toBeGreaterThan(30);
      expect(c.evidence.length).toBeGreaterThan(0);
    }
    expect(r.limitations.join(" ")).toMatch(/no domain reputation/i);
    expect(r.limitations.join(" ")).toMatch(/not a guarantee/i);
    expect(r).not.toHaveProperty("mode");
  });
  it("benign summary is reassuring but cautious", () => {
    const s = templatedSummary("low", [], "email");
    expect(s).toMatch(/isn't proof/);
  });
  it("summary includes category context and top findings", () => {
    const r = buildResult({ text: DEMOS[2].text, category: "marketplace" });
    expect(r.summary).toMatch(/Marketplace scammers/);
    expect(r.summary.toLowerCase()).toContain(r.concerns[0].title.toLowerCase());
  });
  it("verification steps adapt to findings", () => {
    const steps = defaultSteps("job", runRules("Please provide your SSN and pay with gift cards", "job"));
    expect(steps.join(" ")).toMatch(/one-time codes/);
    expect(steps.join(" ")).toMatch(/gift cards/);
  });
  it("formatted findings are plain text with defanged links", () => {
    const out = formatFindings(buildResult({ text: DEMOS[0].text, category: "sms" }));
    expect(out).toMatch(/Risk: HIGH/);
    expect(out).toMatch(/advisory only/);
    expect(out).toContain("[.]");
    expect(out).not.toMatch(/<[a-z]/i);
  });
});

describe("brand impersonation + billing lures", () => {
  const freedom = "Freedom Mobile Notification:\nWe were unable to process your latest monthly bill. Please update your billing details at: https://myfreedom-bill.com";

  it("flags the Freedom Mobile billing phish as HIGH", () => {
    const r = analyzeWithRules(freedom, "sms");
    expect(r.riskLevel).toBe("high");
    expect(r.score).toBeGreaterThanOrEqual(55);
    const ids = r.ruleFindings.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["billing-lure", "brand-offsite-link", "url-structure", "impersonation"]));
    expect(r.urls[0].issues.join(" ")).toMatch(/Look-alike domain.*Freedom Mobile/);
    expect(r.urls[0].issues.join(" ")).toMatch(/bait word "bill"/);
  });
  it("same message is HIGH in email category too", () => {
    expect(analyzeWithRules(freedom, "email").riskLevel).toBe("high");
  });
  it.each([
    ["Rogers: your payment was declined. Verify your card at rogers-secure-pay.com", "high"],
    ["TD: Your account has been locked. Sign in at td-verify.net to restore access", "high"],
    ["Hydro One final notice: service will be interrupted. Pay now at hydroone-billing.top", "high"],
    ["Netflix: payment failed. Update your payment method at netfIix-account.com/update", "high"],
  ])("detects %s", (msg, level) => {
    expect(analyzeWithRules(msg, "sms").riskLevel).toBe(level);
  });
  it("official brand links are not flagged as lookalikes", () => {
    const r = analyzeWithRules("Freedom Mobile: your bill is ready. View it in the app or at https://www.freedommobile.ca/en-CA/account", "sms");
    expect(r.ruleFindings.map((f) => f.id)).not.toContain("brand-offsite-link");
    expect(r.urls[0].issues).toEqual([]);
  });
  it("benign: friend sharing a YouTube link stays low", () => {
    const r = analyzeWithRules("lol you have to watch this https://www.youtube.com/watch?v=dQw4w9WgXcQ", "sms");
    expect(r.riskLevel).toBe("low");
    expect(r.ruleFindings).toEqual([]);
  });
  it("benign: real-looking note without a link stays low", () => {
    const r = analyzeWithRules("Hi, it's Sam. Your Rogers bill came to my place by mistake, I'll drop it off tomorrow.", "sms");
    expect(r.riskLevel).toBe("low");
  });
  it("benign: short words like 'td' or 'ups' inside normal words don't trigger brands", () => {
    const r = analyzeWithRules("Thanks for the update, see you at the studio. Cheers!", "sms");
    expect(r.ruleFindings).toEqual([]);
  });
});
