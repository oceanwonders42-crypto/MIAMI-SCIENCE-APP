import { describe, expect, it } from "vitest";
import { buildWooCouponBody, generateRewardCouponCode } from "@/lib/reward-redemption-woo";
import type { RedemptionOption } from "@/lib/constants";

describe("reward-redemption-woo", () => {
  it("generates unique-looking codes", () => {
    const a = generateRewardCouponCode();
    const b = generateRewardCouponCode();
    expect(a.startsWith("MS-")).toBe(true);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it("maps percent rewards", () => {
    const opt = {
      id: "off_15_next",
      points: 150,
      label: "15% off next order",
      description: "x",
      woo: { kind: "percent" as const, amountPercent: 15 },
    } satisfies RedemptionOption;
    const body = buildWooCouponBody(opt, "MS-TESTCODE", "user-uuid", "ref-uuid");
    expect(body.discount_type).toBe("percent");
    expect(body.amount).toBe("15");
    expect(body.usage_limit).toBe(1);
  });

  it("maps free shipping", () => {
    const opt = {
      id: "free_shipping",
      points: 50,
      label: "Free shipping",
      description: "x",
      woo: { kind: "free_shipping" as const },
    } satisfies RedemptionOption;
    const body = buildWooCouponBody(opt, "MS-ABC", "u", "r");
    expect(body.free_shipping).toBe(true);
    expect(body.amount).toBe("0");
  });
});
