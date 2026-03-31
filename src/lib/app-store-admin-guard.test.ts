import { describe, expect, it, afterEach } from "vitest";
import { shouldRedirectAppStoreAdminPath } from "@/lib/app-store-admin-guard";

describe("shouldRedirectAppStoreAdminPath", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ADMIN_WEB_HOSTS;
  });

  it("does not redirect when App Store build is false", () => {
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: false,
        pathname: "/admin",
        nodeEnv: "production",
        hostHeader: "app.example.com",
      })
    ).toBe(false);
  });

  it("redirects /admin in production when App Store build is true (public host)", () => {
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin",
        nodeEnv: "production",
        hostHeader: "app.example.com",
      })
    ).toBe(true);
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin/affiliates",
        nodeEnv: "production",
        hostHeader: "app.example.com:443",
      })
    ).toBe(true);
  });

  it("does not redirect on allowlisted admin web host in production", () => {
    process.env.NEXT_PUBLIC_ADMIN_WEB_HOSTS = "ops.example.com,admin.internal";
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin",
        nodeEnv: "production",
        hostHeader: "ops.example.com",
      })
    ).toBe(false);
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin/integrations",
        nodeEnv: "production",
        hostHeader: "OPS.EXAMPLE.COM",
      })
    ).toBe(false);
  });

  it("does not redirect in development even when App Store build is true", () => {
    expect(
      shouldRedirectAppStoreAdminPath({
        isAppStoreBuild: true,
        pathname: "/admin",
        nodeEnv: "development",
        hostHeader: "app.example.com",
      })
    ).toBe(false);
  });
});
