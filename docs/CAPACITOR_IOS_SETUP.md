# Capacitor iOS setup — Miami Science Tracker

This doc describes how the iOS app shell is set up and how to run, build, and ship the App Store build.

## Approach

- **Source of truth:** The existing Next.js app. No separate mobile codebase.
- **iOS app:** A Capacitor native shell that loads the **deployed** web app in a WebView (`server.url`). The web app is built and deployed with `NEXT_PUBLIC_APP_STORE_BUILD=true` so Admin is hidden and `/admin` redirects to `/dashboard`.
- **Webhooks:** Remain web-only. They are called by the store (POST to `/api/webhooks/*`); the iOS app never navigates to them.
- **Admin:** Web-only. In the App Store build, Admin is hidden from nav and any direct request to `/admin` is redirected to `/dashboard` by middleware.

## URL strategy

| Context | What happens |
|--------|-------------------------------|
| **Production iOS app** | `capacitor.config.ts` `server.url` is the deployed app URL (e.g. `https://app.mia-science.com` or `NEXT_PUBLIC_APP_URL`). WebView loads that URL. That deployment must have `NEXT_PUBLIC_APP_STORE_BUILD=true`. |
| **Local dev (simulator/device)** | Set `CAPACITOR_SERVER_URL=http://localhost:3000` (or your machine’s LAN IP for a physical device). Run `pnpm dev`, then `pnpm cap:sync` and open Xcode. The app will load the dev server. |
| **External links (shop, store, help, etc.)** | Any link whose origin differs from the app (e.g. mia-science.com, docs, support) opens in **Capacitor Browser** (Safari View Controller). Same-origin links stay in the app. Implemented in `CapacitorShell` + `capacitor-external-links.ts`. |

## How external links behave

- **Inside the app (same origin):** Dashboard, Training, Orders, Account, etc. — all in-app navigation stays in the WebView.
- **Leaving the app (external origin):** “Shop at mia-science.com”, “Buy again”, “View on store”, “Open store account”, help/support links, or any `target="_blank"` / external href open in the **in-app browser** (Safari View Controller) via `@capacitor/browser`. The main app stays on the tracker; closing the sheet returns to the app.
- **Implementation:** A document-level click handler (only active when `window.Capacitor` is present) intercepts clicks on external links and calls `Browser.open({ url })`. Normal browser users are unchanged; the logic no-ops when not in Capacitor.

## What is implemented

- **Capacitor config:** `capacitor.config.ts` — `appId`, `appName`, `webDir: "public"`, `server.url`, `server.errorPath` (offline/error page), `plugins.SplashScreen`, `plugins.StatusBar`.
- **App Store build flag:** `NEXT_PUBLIC_APP_STORE_BUILD=true` hides Admin from nav (Phase 1).
- **Admin redirect:** Middleware redirects `/admin` and `/admin/*` to `/dashboard` when App Store build is enabled.
- **Plugins:** `@capacitor/browser`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/push-notifications` — used only when running inside Capacitor.
- **CapacitorShell:** Root-layout client component that, when in Capacitor: sets status bar style (light content for dark theme), hides splash after first paint, attaches the external-link handler, and registers push listeners + optional APNs registration when the user has **Push** enabled in Account.
- **Push:** Device tokens are stored in Supabase `push_tokens` (one row per user per platform). The server sends iOS alerts via APNs when `APNS_*` env vars are set and the notification cron runs. Configure **Push Notifications** capability in Xcode (see below).
- **Offline/error page:** `public/capacitor-error.html` is shown when the remote URL is unreachable (`server.errorPath`). “Try again” reloads the WebView.
- **Scripts:** `pnpm cap:sync`, `pnpm cap:ios`.

## Package install

From the project root:

```bash
pnpm install
```

Then (one-time) add the iOS project and sync:

```bash
npx cap add ios
pnpm cap:sync
```

## Env vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_STORE_BUILD=true` | Set on the **web** deployment that the iOS app loads. Hides Admin and enables `/admin` redirect. |
| `CAPACITOR_SERVER_URL` | URL the iOS app loads. Used at `cap sync` time. For local dev use `http://localhost:3000` (or LAN IP). Unset in production so the config uses `NEXT_PUBLIC_APP_URL` or default. |
| `NEXT_PUBLIC_APP_URL` | Fallback for `server.url` when `CAPACITOR_SERVER_URL` is unset (e.g. production app URL). |

No new env vars were added for the polish phase; existing App Store and Capacitor vars are unchanged.

## How to test: local vs production

### 1. Web only (simulate App Store build)

- In `.env.local`: `NEXT_PUBLIC_APP_STORE_BUILD=true`.
- Run `pnpm dev`.
- **Verify:** Admin is hidden in the sidebar; visiting `/admin` redirects to `/dashboard`. External links open in a new browser tab (normal web behavior).

### 2. iOS simulator — load dev server

- In `.env.local`: `CAPACITOR_SERVER_URL=http://localhost:3000` and `NEXT_PUBLIC_APP_STORE_BUILD=true`.
- Terminal 1: `pnpm dev`.
- Terminal 2: `pnpm cap:sync` then `pnpm cap:ios`; run the app on a simulator.
- **Verify:** App loads localhost; status bar is light; splash hides; no Admin; `/admin` redirects; tapping “Shop at mia-science.com” (or any external link) opens Safari View Controller, not the main WebView.

### 3. iOS simulator — load production URL

- Unset `CAPACITOR_SERVER_URL` (or set to your deployed App Store URL). Run `pnpm cap:sync` and `pnpm cap:ios`.
- **Verify:** App loads the deployed site; same behavior as above. Ensure that deployment has `NEXT_PUBLIC_APP_STORE_BUILD=true`.

### 4. Offline / error page

- With the app running in the simulator, turn off the network (or point `CAPACITOR_SERVER_URL` to an invalid URL and sync). Relaunch the app.
- **Verify:** The “Can’t connect” fallback page (`capacitor-error.html`) appears with a “Try again” button; no blank white screen.

## Final Xcode steps

1. **Open the project:**  
   `pnpm cap:ios` (or open `ios/App/App.xcworkspace`).

2. **Signing:**  
   Select the **App** target → **Signing & Capabilities**. Choose your Team and let Xcode manage provisioning, or select a distribution profile for release.

3. **Push Notifications (for APNs):**  
   In **Signing & Capabilities**, click **+ Capability** → **Push Notifications**. After `pnpm cap:sync`, confirm the Push Notifications capability is present. Your server needs the APNs Auth Key env vars (see `.env.example`: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID`, `APNS_PRODUCTION`). The bundle ID must match `APNS_BUNDLE_ID`.

4. **Bundle ID:**  
   Ensure the Bundle Identifier matches what you use in App Store Connect (e.g. `com.miascience.tracker`).

5. **Icons and launch screen:**  
   Replace placeholders in `ios/App/App/Assets.xcassets`: **AppIcon** (all sizes, including 1024×1024 for App Store), **SplashScreen** / launch image if you use a custom splash.

6. **Build and run:**  
   Select a simulator or device, then Run (⌘R). For release build, select “Any iOS Device” (or a device), then **Product → Archive**.

7. **Archive and upload:**  
   After archiving, **Distribute App** → **App Store Connect** → **Upload**. Then in App Store Connect, add the build to a version and submit for review.

## TestFlight submission notes

- **Build:** Use a release (or at least a non-debug) configuration when archiving so the app is optimized and uses the production `server.url` (no `CAPACITOR_SERVER_URL` in the archive environment).
- **Version and build number:** Bump **Version** (e.g. 1.0.0) and **Build** (e.g. 1) in Xcode so each upload has a unique build number.
- **TestFlight group:** Create an internal or external group, add testers, and ensure “What to Test” describes that this is a companion app for the Miami Science store (workouts, supply, orders, rewards); purchasing happens on the website.
- **Compliance:** Answer export compliance and encryption as required (typically “No” for this app). If you use IDFA or similar, complete the relevant prompts.

## App Review — reviewer notes recommendation

To reduce “wrapped website” (Guideline 4.2) and clarity of purpose, include a short **Notes for Review** (or App Review Information) along these lines:

- **Purpose:** “Miami Science Tracker is a companion app for customers of the Miami Science store (mia-science.com). It lets users track workouts, supplement supply, order history, and rewards. The store sells physical products; purchasing is done on the website or via invoice, not in the app.”
- **Login:** “You can sign up or log in with email inside the app. For a quick review, use the in-app signup; no external account is required.”
- **External links:** “Links to the store (e.g. ‘Shop’ or ‘Buy again’) open in an in-app browser (Safari View Controller) so users can shop without leaving the app context.”
- **Admin:** “Admin and operator tools are web-only and are not included in this build; the App Store build is customer- and affiliate-facing only.”

Keep the tone factual and short; avoid marketing language.

## iOS App Store release checklist

Use this as a final pass before TestFlight/App Store submit.

1. **Install and sync**
   ```bash
   pnpm install
   npx cap add ios   # only if ios/ does not exist yet
   pnpm cap:sync
   ```

2. **Simulator test**
   - Set `.env.local`: `CAPACITOR_SERVER_URL=http://localhost:3000`, `NEXT_PUBLIC_APP_STORE_BUILD=true`.
   - Run `pnpm dev` in one terminal; in another run `pnpm cap:sync` then `pnpm cap:ios`. Run the app on a simulator.
   - Confirm: app loads, no Admin in nav, `/admin` redirects to `/dashboard`, external links (e.g. Shop) open in Safari View Controller, status bar and splash behave, offline shows error page.

3. **Physical iPhone test**
   - Use your machine’s LAN IP for `CAPACITOR_SERVER_URL` (e.g. `http://192.168.1.x:3000`). Ensure phone and Mac are on the same network. Run `pnpm cap:sync`, then in Xcode select your device and Run.
   - Confirm same behavior as simulator; test on a real device at least once before archive.

4. **Archive and upload**
   - In Xcode: select **Any iOS Device** (or a connected device). **Product → Archive**.
   - In Organizer: **Distribute App** → **App Store Connect** → **Upload**. Complete the dialog.
   - In App Store Connect: add the build to your app version, fill in “What’s New” and review info, submit for review.

5. **App Store reviewer notes (template)**
   - **Purpose:** Miami Science Tracker is a companion app for customers of the Miami Science store (mia-science.com). It lets users track workouts, supplement supply, order history, and rewards. The store sells physical products; purchasing is done on the website or via invoice, not in the app.
   - **Login:** Sign up or log in with email inside the app. No external account required for review.
   - **External links:** Links to the store (e.g. Shop, Buy again) open in an in-app browser (Safari View Controller).
   - **Admin:** Admin and operator tools are web-only and are not included in this build; the App Store build is customer- and affiliate-facing only.

## Xcode handoff checklist (exact manual steps)

Follow this after `pnpm install`, `npx cap add ios` (if `ios/` was missing), and `pnpm cap:sync`.

1. **Open the project**
   - Open `ios/App/App.xcworkspace` in Xcode (not the `.xcodeproj`).

2. **Set Team, Bundle Identifier, Signing**
   - Select the **App** target in the project navigator.
   - **Signing & Capabilities** tab: choose your **Team**; set **Bundle Identifier** (e.g. `com.miascience.tracker`) to match App Store Connect.
   - Use “Automatically manage signing” or select a distribution provisioning profile for release.

3. **Replace assets**
   - **AppIcon:** In `ios/App/App/Assets.xcassets`, replace **AppIcon** with your 1024×1024 and required sizes.
   - **Splash / launch:** Replace splash/launch assets if you use a custom splash.

4. **Simulator pass**
   - Select an iOS simulator as the run destination. Press **Run** (⌘R).
   - Confirm: app loads, no Admin, `/admin` redirects, external links open in Safari View Controller.

5. **Physical iPhone pass**
   - Connect an iPhone; select it as the run destination. Run (⌘R).
   - Confirm the same behavior; test at least once on device before archiving.

6. **Archive**
   - Select **Any iOS Device** (or a connected device) as destination. **Product → Archive**.
   - Wait for the archive to finish.

7. **Upload to App Store Connect / TestFlight**
   - In the Organizer window: **Distribute App** → **App Store Connect** → **Upload**. Complete the wizard.
   - In App Store Connect: open your app → **TestFlight** (or **App Store** tab), add the new build to a version, add “What to Test” if using TestFlight, then submit for review when ready.

## Known limitations

- **Remote dependency:** The app loads its main content from a remote web deployment (`server.url`). If that URL is down or unreachable, the app shows the offline/error page (“Can’t connect”) until the service is back or the user retries.
- **Admin in App Store build:** Admin and all `/admin/*` routes are intentionally hidden and redirected to `/dashboard` when `NEXT_PUBLIC_APP_STORE_BUILD=true`. Operator tools remain on the web-only deployment.
- **External links:** Links to other origins (store, help, support) intentionally open in the in-app browser (Safari View Controller), not inside the main app WebView, so the tracker experience stays focused and store/shop flows use the system browser UI.

## Summary

- **RECOMMENDED SETUP:** Single Next.js app; Capacitor iOS shell loads it via `server.url`. App Store deployment uses `NEXT_PUBLIC_APP_STORE_BUILD=true`; admin is hidden and redirect-protected; external links open in Safari View Controller; status bar and splash are configured; offline shows a fallback page.
- **FILES CHANGED (this phase):** `package.json`, `capacitor.config.ts`, `public/capacitor-error.html`, `src/lib/capacitor-external-links.ts`, `src/components/capacitor/CapacitorShell.tsx`, `src/app/layout.tsx`, this doc.
- **READY NOW:** Config, plugins, external-link handling, status bar, splash config, error page, and docs. Run `pnpm install`, `npx cap add ios` (if not done), `pnpm cap:sync`, then open in Xcode.
- **STILL NEEDED IN XCODE:** Signing, AppIcon (and optional Splash) assets, archive and upload to App Store Connect, TestFlight and App Review as above.
