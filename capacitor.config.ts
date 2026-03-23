import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config for the iOS app shell.
 * The app loads the deployed Next.js web app (server.url). Set CAPACITOR_SERVER_URL
 * for local dev (e.g. http://localhost:3000) or leave unset to use production URL.
 */
const config: CapacitorConfig = {
  appId: "com.miascience.tracker",
  appName: "Miami Science Tracker",
  webDir: "public",
  server: {
    url:
      process.env.CAPACITOR_SERVER_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://app.mia-science.com",
    cleartext: process.env.CAPACITOR_SERVER_URL?.startsWith("http://") ?? false,
    errorPath: "capacitor-error.html",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#18181b",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
