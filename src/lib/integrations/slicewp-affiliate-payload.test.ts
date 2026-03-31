import { describe, expect, it } from "vitest";
import { normalizeSliceWPSingleAffiliatePayload } from "@/lib/integrations/slicewp";

describe("normalizeSliceWPSingleAffiliatePayload", () => {
  it("unwraps array body", () => {
    const row = normalizeSliceWPSingleAffiliatePayload([
      { id: 9, email: "a@b.com", referral_url: "https://x/?ref=1" },
    ]);
    expect(row?.id).toBe(9);
    expect(row?.referral_url).toBe("https://x/?ref=1");
  });

  it("unwraps { data: affiliate }", () => {
    const row = normalizeSliceWPSingleAffiliatePayload({
      data: { id: 3, user_email: "u@x.com", coupon_code: "TEN" },
    });
    expect(row?.id).toBe(3);
    expect(row?.coupon_code).toBe("TEN");
  });

  it("returns null for WordPress REST error envelope", () => {
    expect(
      normalizeSliceWPSingleAffiliatePayload({
        code: "rest_forbidden",
        message: "Sorry, you are not allowed to do that.",
        data: { status: 401 },
      })
    ).toBeNull();
  });

  it("keeps plain affiliate object", () => {
    const row = normalizeSliceWPSingleAffiliatePayload({
      id: 1,
      email: "e@e.com",
    });
    expect(row?.id).toBe(1);
    expect(row?.email).toBe("e@e.com");
  });
});
