import { describe, expect, it } from "vitest";
import type { AffiliateProfile } from "@/types";
import {
  AFFILIATE_UNLOCK_CODE,
  hasAppAffiliateCouponPair,
  hasCompletedAffiliateProgramOnboarding,
  isAffiliateUnlockCodeValid,
  normalizeAffiliatePromoCode,
} from "@/lib/affiliate-access";

function ap(over: Partial<AffiliateProfile> = {}): AffiliateProfile {
  return {
    id: "ap1",
    user_id: "u1",
    referral_code: "REF",
    coupon_code: null,
    referral_link: null,
    payout_status: null,
    payout_method: null,
    payout_details: null,
    slicewp_affiliate_id: null,
    affiliate_external_synced_at: null,
    affiliate_external_sync_error: null,
    woo_coupon_id: null,
    coupon_discount_percent: null,
    commission_percent: null,
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("normalizeAffiliatePromoCode", () => {
  it("uppercases and accepts hyphen underscore", () => {
    expect(normalizeAffiliatePromoCode(" save-10_x ")).toEqual({
      ok: true,
      code: "SAVE-10_X",
    });
  });

  it("rejects spaces inside", () => {
    expect(normalizeAffiliatePromoCode("SAVE 10").ok).toBe(false);
  });

  it("rejects empty", () => {
    expect(normalizeAffiliatePromoCode("  ").ok).toBe(false);
  });
});

describe("hasCompletedAffiliateProgramOnboarding", () => {
  it("is false when slice-only (email auto-link style profile)", () => {
    expect(
      hasCompletedAffiliateProgramOnboarding(
        ap({ slicewp_affiliate_id: "9", coupon_code: null, woo_coupon_id: null })
      )
    ).toBe(false);
  });

  it("is true when slice + promo + positive woo id", () => {
    expect(
      hasCompletedAffiliateProgramOnboarding(
        ap({ slicewp_affiliate_id: "9", coupon_code: "SAVE10", woo_coupon_id: 42 })
      )
    ).toBe(true);
  });

  it("is false when woo id is zero", () => {
    expect(
      hasCompletedAffiliateProgramOnboarding(
        ap({ slicewp_affiliate_id: "9", coupon_code: "SAVE10", woo_coupon_id: 0 })
      )
    ).toBe(false);
  });
});

describe("hasAppAffiliateCouponPair", () => {
  it("is true with code and woo id", () => {
    expect(hasAppAffiliateCouponPair(ap({ coupon_code: "X", woo_coupon_id: 1 }))).toBe(true);
  });

  it("is false without woo id", () => {
    expect(hasAppAffiliateCouponPair(ap({ coupon_code: "X", woo_coupon_id: null }))).toBe(false);
  });
});

describe("isAffiliateUnlockCodeValid", () => {
  it("accepts ULTRA case-insensitively", () => {
    expect(isAffiliateUnlockCodeValid("ultra")).toBe(true);
    expect(isAffiliateUnlockCodeValid("  ULTRA  ")).toBe(true);
    expect(isAffiliateUnlockCodeValid(AFFILIATE_UNLOCK_CODE)).toBe(true);
  });

  it("rejects other codes", () => {
    expect(isAffiliateUnlockCodeValid("ULTR")).toBe(false);
    expect(isAffiliateUnlockCodeValid("")).toBe(false);
  });
});
