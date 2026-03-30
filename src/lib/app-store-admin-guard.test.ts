import { describe, expect, it } from "vitest";
import { shouldRedirectAppStoreAdminPath } from "@/lib/app-store-admin-guard";

describe("shouldRedirectAppStoreAdminPath", () => {
  it("does not redirect when App Store build is false", () => {
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: false,
        pathname: "/admin",
        nodeEnv: "production",
      })
    ).toBe(false);
  });

  it("redirects /admin in production when App Store build is true", () => {
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin",
        nodeEnv: "production",
      })
    ).toBe(true);
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin/affiliates",
        nodeEnv: "production",
      })
    ).toBe(true);
  });

  it("does not redirect in development even when App Store build is true", () => {
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin",
        nodeEnv: "development",
      })
    ).toBe(false);
  });
});
