import { describe, expect, it } from "vitest";
import { analyzeUrl, extractUrls, parseHost } from "@/lib/urls";

describe("extractUrls", () => {
  it("finds http, https, www and bare domains with paths", () => {
    const t = "Go to https://example.com/a, or www.test.org and http://1.2.3.4/x. Also paypal-secure.xyz/login now.";
    expect(extractUrls(t)).toEqual(["https://example.com/a", "www.test.org", "http://1.2.3.4/x", "paypal-secure.xyz/login"]);
  });
  it("strips trailing punctuation and dedupes", () => {
    expect(extractUrls("see https://a.com/x). again https://a.com/x!")).toEqual(["https://a.com/x"]);
  });
  it("ignores email address domains", () => {
    expect(extractUrls("mail me at bob@gmail.com please")).toEqual([]);
  });
  it("returns empty for no urls", () => {
    expect(extractUrls("hello there, how are you")).toEqual([]);
  });
});

describe("parseHost", () => {
  it("parses hosts without network", () => {
    expect(parseHost("www.Example.com/path")).toBe("www.example.com");
    expect(parseHost("hxxps://bad.com")).toBe("bad.com");
  });
});

describe("analyzeUrl", () => {
  const issues = (u: string) => analyzeUrl(u).issues.join(" | ");
  it("flags IP hosts", () => expect(issues("http://192.168.10.5/login")).toMatch(/IP address/));
  it("flags http", () => expect(issues("http://example.com")).toMatch(/http:\/\//));
  it("flags punycode", () => expect(issues("https://xn--pypal-4ve.com")).toMatch(/Punycode/));
  it("flags shorteners", () => expect(issues("https://bit.ly/abc")).toMatch(/shortener/));
  it("flags @ in URL", () => expect(issues("https://paypal.com@evil.example/x")).toMatch(/'@'/));
  it("flags many subdomains", () => expect(issues("https://a.b.c.d.example.com")).toMatch(/many subdomains/));
  it("flags unusual TLDs", () => expect(issues("https://deals.xyz")).toMatch(/\.xyz/));
  it("flags brand in subdomain", () => expect(issues("https://paypal.account-verify.com/")).toMatch(/Look-alike domain.*PayPal/));
  it("flags lookalike domain", () => expect(issues("https://paypa1.com")).toMatch(/Look-alike domain.*PayPal/));
  it("flags brand embedded in unrelated domain", () => expect(issues("http://usps.com-track.xyz/u")).toMatch(/usps/));
  it("does not flag official domains", () => {
    expect(analyzeUrl("https://www.paypal.com/signin").issues).toEqual([]);
    expect(analyzeUrl("https://www.amazon.co.uk/orders").issues).toEqual([]);
  });
});
