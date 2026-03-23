/**
 * Capacitor-only helpers: external link handling, status bar, splash.
 * All functions no-op when not running inside Capacitor (e.g. normal browser).
 */

function getAppOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/**
 * True if url is absolute and has a different origin than the current app.
 * Same-origin and relative URLs return false.
 */
export function isExternalUrl(url: string): boolean {
  if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("sms:")) {
    return false;
  }
  try {
    const parsed = new URL(url, getAppOrigin());
    return parsed.origin !== getAppOrigin();
  } catch {
    return false;
  }
}

/**
 * Open url in Capacitor Browser (Safari View Controller) when available.
 * No-op in normal browser or if Capacitor/Browser not present.
 */
export async function openInBrowser(url: string): Promise<void> {
  if (typeof window === "undefined") return;
  const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
  if (!cap || cap.getPlatform() === "web") return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } catch {
    // Plugin not available or open failed; fallback to window.open or leave as-is
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

type Cleanup = () => void;

/**
 * Attach a document-level click handler so external links open in Capacitor Browser.
 * Same-origin links are left to normal navigation. Returns a cleanup function.
 * Call only when Capacitor is present (e.g. from CapacitorShell useEffect).
 */
export function setupExternalLinkHandler(): Cleanup {
  if (typeof document === "undefined") return () => {};

  function handleClick(e: MouseEvent) {
    const anchor = (e.target as Element)?.closest("a");
    if (!anchor || !anchor.href) return;
    if (anchor.target === "_blank" || anchor.getAttribute("rel") === "external") {
      if (isExternalUrl(anchor.href)) {
        e.preventDefault();
        openInBrowser(anchor.href);
      }
      return;
    }
    if (isExternalUrl(anchor.href)) {
      e.preventDefault();
      openInBrowser(anchor.href);
    }
  }

  document.addEventListener("click", handleClick, true);
  return () => document.removeEventListener("click", handleClick, true);
}

/**
 * Initialize status bar style for dark theme (light content). No-op outside Capacitor.
 */
export async function initStatusBar(): Promise<void> {
  if (typeof window === "undefined") return;
  const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
  if (!cap || cap.getPlatform() === "web") return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // Plugin not available
  }
}

/**
 * Hide the native splash screen when the app is ready. No-op outside Capacitor.
 */
export async function hideSplashScreen(): Promise<void> {
  if (typeof window === "undefined") return;
  const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
  if (!cap || cap.getPlatform() === "web") return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // Plugin not available
  }
}
