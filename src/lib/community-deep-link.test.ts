import { describe, expect, it } from "vitest";
import { AFFILIATE_ROOM_SLUG } from "@/lib/affiliate-chat";
import { ROUTES } from "@/lib/constants";

/** Mirrors AppNav COMMUNITY_AFFILIATE_HREF — must stay aligned with bottom Chat and Explore. */
function communityAffiliateHref() {
  return `${ROUTES.community}?room=${encodeURIComponent(AFFILIATE_ROOM_SLUG)}`;
}

describe("community affiliate deep link", () => {
  it("uses slug affiliates for query param", () => {
    expect(AFFILIATE_ROOM_SLUG).toBe("affiliates");
    expect(communityAffiliateHref()).toBe("/community?room=affiliates");
  });
});
