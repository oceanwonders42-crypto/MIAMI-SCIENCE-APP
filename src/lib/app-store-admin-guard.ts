/**
 * App Store builds hide /admin in production so the shipped app cannot open admin URLs.
 * Local `next dev` keeps /admin reachable even when NEXT_PUBLIC_APP_STORE_BUILD=true so QA
 * can match production client bundles without toggling env on every run.
 *
 * Operator / admin web: set NEXT_PUBLIC_ADMIN_WEB_HOSTS to a comma-separated list of hostnames
 * (no port) that may access /admin even when NEXT_PUBLIC_APP_STORE_BUILD=true on production.
 * Point a dedicated Vercel domain (e.g. ops.app.mia-science.com) at the same project with this
 * env set; the public app host stays App Store–aligned without /admin.
 */
export function adminWebHostAllowed(hostHeader: string | null | undefined): boolean {
  const raw = process.env.NEXT_PUBLIC_ADMIN_WEB_HOSTS?.trim();
  if (!raw || !hostHeader) return false;
  const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.some((a) => host === a || host.endsWith(`.${a}`));
}

export function shouldRedirectAppStoreAdminPath(args: {
  isAppStoreBuild: boolean;
  pathname: string;
  nodeEnv: string | undefined;
  hostHeader: string | null | undefined;
}): boolean {
  const { isAppStoreBuild, pathname, nodeEnv, hostHeader } = args;
  if (!isAppStoreBuild || !pathname.startsWith("/admin")) {
    return false;
  }
  if (nodeEnv !== "production") {
    return false;
  }
  if (adminWebHostAllowed(hostHeader)) {
    return false;
  }
  return true;
}
