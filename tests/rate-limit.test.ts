import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("blocks after limit and resets after window", () => {
    const rl = createRateLimiter(2, 1000);
    expect(rl("ip", 0).ok).toBe(true);
    expect(rl("ip", 1).ok).toBe(true);
    expect(rl("ip", 2).ok).toBe(false);
    expect(rl("other", 2).ok).toBe(true);
    expect(rl("ip", 1001).ok).toBe(true);
  });
});
