/**
 * App Store builds hide /admin in production so the shipped app cannot open admin URLs.
 * Local `next dev` keeps /admin reachable even when NEXT_PUBLIC_APP_STORE_BUILD=true so QA
 * can match production client bundles without toggling env on every run.
 */
export function shouldRedirectAppStoreAdminPath(args: {
  isAppStoreBuild: boolean;
  pathname: string;
  nodeEnv: string | undefined;
}): boolean {
  const { isAppStoreBuild, pathname, nodeEnv } = args;
  if (!isAppStoreBuild || !pathname.startsWith("/admin")) {
    return false;
  }
  return nodeEnv === "production";
}
