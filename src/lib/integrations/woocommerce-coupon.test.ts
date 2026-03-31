import { describe, expect, it } from "vitest";
import type { RawWooCoupon } from "@/lib/integrations/woocommerce-client";
import {
  pickCouponMatchingCode,
  couponEmailRestrictionsAllow,
} from "@/lib/integrations/woocommerce-client";

describe("pickCouponMatchingCode", () => {
  it("matches exact code case-insensitively", () => {
    const rows: RawWooCoupon[] = [
      { id: 1, code: "save10" },
      { id: 2, code: "OTHER" },
    ];
    expect(pickCouponMatchingCode(rows, "SAVE10")?.id).toBe(1);
  });

  it("returns null when no exact code match", () => {
    const rows: RawWooCoupon[] = [{ id: 1, code: "PARTIAL" }];
    expect(pickCouponMatchingCode(rows, "SAVE10")).toBe(null);
  });
});

describe("couponEmailRestrictionsAllow", () => {
  it("allows any email when restrictions empty", () => {
    expect(couponEmailRestrictionsAllow([], "a@b.com")).toEqual({
      ok: true,
      reason: "no_restrictions",
    });
  });

  it("allows when affiliate email is in list", () => {
    expect(
      couponEmailRestrictionsAllow(["A@B.com", "x@y.com"], "a@b.com")
    ).toEqual({ ok: true, reason: "allowed" });
  });

  it("blocks when list non-empty and email missing", () => {
    expect(couponEmailRestrictionsAllow(["x@y.com"], "a@b.com")).toEqual({
      ok: false,
      reason: "blocked",
    });
  });

  it("missing_affiliate_email when restrictions exist but email blank", () => {
    expect(couponEmailRestrictionsAllow(["x@y.com"], null)).toEqual({
      ok: false,
      reason: "missing_affiliate_email",
    });
  });
});
