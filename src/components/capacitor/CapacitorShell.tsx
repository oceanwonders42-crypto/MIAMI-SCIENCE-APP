"use client";

import { useEffect } from "react";
import {
  initStatusBar,
  hideSplashScreen,
  setupExternalLinkHandler,
} from "@/lib/capacitor-external-links";
import { setupNativePush } from "@/lib/capacitor/native-push";

/**
 * Runs only when the app is loaded inside Capacitor (iOS/Android).
 * - Sets status bar style (light content for dark theme).
 * - Hides splash screen when the web view is ready.
 * - Delegates external link clicks to Capacitor Browser (Safari View Controller).
 * Renders nothing; normal browser users are unaffected.
 */
export function CapacitorShell() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
    if (!cap || cap.getPlatform() === "web") return;

    let cleanup: (() => void) | undefined;
    let cleanupPush: (() => void) | undefined;

    (async () => {
      await initStatusBar();
      cleanup = setupExternalLinkHandler();
      cleanupPush = await setupNativePush();
      // Hide splash after a short delay so the first paint has happened
      setTimeout(() => {
        hideSplashScreen();
      }, 300);
    })();

    return () => {
      cleanupPush?.();
      cleanup?.();
    };
  }, []);

  return null;
}
