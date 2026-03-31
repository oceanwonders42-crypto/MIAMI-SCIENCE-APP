import { describe, expect, it, vi, afterEach } from "vitest";
import type { AffiliateProfile } from "@/types";
import {
  affiliatePromoCodeDisplayAllowed,
  isAffiliateExternalSyncFresh,
  AFFILIATE_EXTERNAL_SYNC_STALE_MS,
} from "@/lib/integrations/affiliate-external-sync";

function baseProfile(over: Partial<AffiliateProfile> = {}): AffiliateProfile {
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
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("affiliatePromoCodeDisplayAllowed", () => {
  it("returns code when mismatch is none", () => {
    expect(affiliatePromoCodeDisplayAllowed("SAVE10", "none")).toBe("SAVE10");
  });

  it("returns null when Slice has no coupon (slice_missing_coupon)", () => {
    expect(affiliatePromoCodeDisplayAllowed("OLD", "slice_missing_coupon")).toBe(null);
  });

  it("returns null when WooCommerce does not have the coupon", () => {
    expect(affiliatePromoCodeDisplayAllowed("SAVE10", "coupon_not_in_woocommerce")).toBe(null);
  });

  it("still returns code when email restrictions fail (show with warning)", () => {
    expect(affiliatePromoCodeDisplayAllowed("SAVE10", "email_restrictions")).toBe("SAVE10");
  });

  it("returns code when Woo is not configured (Slice-only path)", () => {
    expect(affiliatePromoCodeDisplayAllowed("SAVE10", "woo_not_configured")).toBe("SAVE10");
  });
});

describe("isAffiliateExternalSyncFresh", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is false when force is true", () => {
    const p = baseProfile({
      affiliate_external_synced_at: new Date().toISOString(),
    });
    expect(isAffiliateExternalSyncFresh(p, true)).toBe(false);
  });

  it("is false when affiliate_external_sync_error is set", () => {
    const p = baseProfile({
      affiliate_external_synced_at: new Date().toISOString(),
      affiliate_external_sync_error: "WooCommerce coupon lookup failed",
    });
    expect(isAffiliateExternalSyncFresh(p, false)).toBe(false);
  });

  it("is false when never synced", () => {
    const p = baseProfile({ affiliate_external_synced_at: null });
    expect(isAffiliateExternalSyncFresh(p, false)).toBe(false);
  });

  it("is true when synced recently and no error", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.setSystemTime(now);
    const synced = new Date(now.getTime() - 60_000).toISOString();
    const p = baseProfile({
      affiliate_external_synced_at: synced,
      affiliate_external_sync_error: null,
    });
    expect(isAffiliateExternalSyncFresh(p, false)).toBe(true);
  });

  it("is false when synced beyond stale window", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.setSystemTime(now);
    const synced = new Date(now.getTime() - AFFILIATE_EXTERNAL_SYNC_STALE_MS - 1000).toISOString();
    const p = baseProfile({
      affiliate_external_synced_at: synced,
      affiliate_external_sync_error: null,
    });
    expect(isAffiliateExternalSyncFresh(p, false)).toBe(false);
  });
});
