import { ROUTES } from "@/lib/constants";

/**
 * Absolute origin for auth redirects (password reset email link).
 * Prefer NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL in production so email links
 * match Supabase "Redirect URLs" and Capacitor uses the hosted app, not a stale origin.
 */
export function getAuthSiteOrigin(): string {
  const fromEnv =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL)?.replace(
        /\/$/,
        ""
      )) ||
    "";
  if (typeof window !== "undefined") {
    if (fromEnv) return fromEnv;
    return window.location.origin;
  }
  return fromEnv;
}

/** `redirectTo` passed to `resetPasswordForEmail` — must be listed in Supabase Auth → URL Configuration → Redirect URLs. */
export function getPasswordResetRedirectTo(): string {
  const origin = getAuthSiteOrigin();
  if (!origin) {
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL) so password reset links use your app URL."
    );
  }
  return `${origin.replace(/\/$/, "")}${ROUTES.resetPassword}`;
}

/** Map Supabase / validation errors to short UI copy. */
export function mapPasswordUpdateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("same as")) return "Choose a different password than your current one.";
  if (m.includes("weak") || m.includes("least") || m.includes("short") || m.includes("long"))
    return "Password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  if (m.includes("jwt") || m.includes("expired") || m.includes("invalid"))
    return "This session is no longer valid. Open the link from your latest email or request a new reset.";
  return message;
}

export function mapRecoverySessionError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired") || m.includes("invalid") || m.includes("otp"))
    return "This reset link is invalid or has expired. Request a new one from Forgot password.";
  if (m.includes("flow_state") || m.includes("code"))
    return "This reset link was already used or is invalid. Request a new reset link.";
  return "We couldn’t verify your reset link. Request a new one from Forgot password.";
}
