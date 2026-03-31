import { describe, expect, it } from "vitest";
import {
  AFFILIATE_UNLOCK_CODE,
  isAffiliateUnlockCodeValid,
  normalizeAffiliatePromoCode,
} from "@/lib/affiliate-access";

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
