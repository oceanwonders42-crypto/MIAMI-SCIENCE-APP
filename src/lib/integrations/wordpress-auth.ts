import { fetchCustomersSearch, getWooCommerceConfig } from "@/lib/integrations/woocommerce-client";
import { normalizeWordPressEmail } from "@/lib/wordpress-user-link";

const WORDPRESS_ADMIN_ROLES = new Set(["administrator", "shop_manager"]);

type WordPressJwtTokenResponse = {
  token?: string;
  user_email?: string;
  user_display_name?: string;
  user_nicename?: string;
  user_id?: number | string;
};

type WordPressMeResponse = {
  id?: number;
  email?: string;
  slug?: string;
  name?: string;
  roles?: string[];
};

type WordPressLoginFormProfile = {
  wordpressUserId: number;
  email: string;
  displayName: string | null;
};

export type WordPressAuthUser = {
  wordpressUserId: number;
  email: string;
  displayName: string | null;
  wordpressRole: string | null;
  isWordPressAdmin: boolean;
};

function getWordPressSiteBaseUrl(): string | null {
  const explicit = process.env.WORDPRESS_AUTH_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const fromWoo = process.env.WOOCOMMERCE_URL?.trim();
  if (fromWoo) return fromWoo.replace(/\/$/, "");
  return null;
}

function getWordPressJwtPath(): string {
  const path = process.env.WORDPRESS_AUTH_JWT_PATH?.trim();
  if (!path) return "/wp-json/jwt-auth/v1/token";
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeRole(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const role = input.trim().toLowerCase();
  return role || null;
}

function isWpAdminRole(role: string | null): boolean {
  return role != null && WORDPRESS_ADMIN_ROLES.has(role);
}

function parseSetCookieHeaders(res: Response): string[] {
  const h = res.headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof h.getSetCookie === "function") {
    return h.getSetCookie();
  }
  const raw = res.headers.get("set-cookie");
  if (!raw) return [];
  return raw
    .split(/,(?=\s*[a-zA-Z0-9_\-]+=)/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function cookieHeaderFromSetCookie(setCookies: string[]): string {
  return setCookies
    .map((c) => c.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
}

function parseProfileField(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `name=["']${escaped}["'][^>]*value=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (!m?.[1]) return null;
  return m[1].trim() || null;
}

async function authViaWordPressLoginForm(
  baseUrl: string,
  identifier: string,
  password: string
): Promise<WordPressLoginFormProfile | null> {
  async function tryLogin(loginIdentifier: string): Promise<WordPressLoginFormProfile | null> {
    const loginUrl = `${baseUrl}/wp-login.php`;
    const form = new URLSearchParams({
      log: loginIdentifier,
      pwd: password,
      "wp-submit": "Log In",
      redirect_to: `${baseUrl}/wp-admin/profile.php`,
      testcookie: "1",
    }).toString();

    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
      },
      body: form,
      redirect: "manual",
      cache: "no-store",
    }).catch(() => null);
    if (!loginRes) return null;

    const setCookies = parseSetCookieHeaders(loginRes);
    const hasWpSession = setCookies.some((c) =>
      /^wordpress_logged_in_/i.test(c.trim())
    );
    if (!hasWpSession) return null;

    const cookieHeader = cookieHeaderFromSetCookie(setCookies);
    if (!cookieHeader) return null;

    const profileRes = await fetch(`${baseUrl}/wp-admin/profile.php`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    }).catch(() => null);
    if (!profileRes?.ok) return null;
    const profileHtml = await profileRes.text().catch(() => "");
    if (!profileHtml) return null;

    const userIdRaw = parseProfileField(profileHtml, "user_id");
    const emailRaw =
      parseProfileField(profileHtml, "email") ??
      parseProfileField(profileHtml, "user_email");
    const displayRaw =
      parseProfileField(profileHtml, "display_name") ??
      parseProfileField(profileHtml, "nickname");

    const wordpressUserId = parseInt(String(userIdRaw ?? ""), 10);
    const email = normalizeWordPressEmail(emailRaw);
    if (!Number.isInteger(wordpressUserId) || wordpressUserId < 1 || !email) {
      return null;
    }

    return {
      wordpressUserId,
      email,
      displayName: displayRaw?.trim() || null,
    };
  }

  const firstTry = await tryLogin(identifier);
  if (firstTry) return firstTry;

  const maybeEmail = normalizeWordPressEmail(identifier);
  if (!maybeEmail || !maybeEmail.includes("@")) return null;
  const wooConfig = getWooCommerceConfig();
  if (!wooConfig) return null;
  const byEmail = await fetchCustomersSearch(wooConfig, maybeEmail, { per_page: 100 });
  if (!byEmail.ok) return null;
  const exact = byEmail.data.find(
    (row) =>
      normalizeWordPressEmail(typeof row.email === "string" ? row.email : null) ===
      maybeEmail
  ) as (Record<string, unknown> & { username?: string }) | undefined;
  const username =
    typeof exact?.username === "string" && exact.username.trim()
      ? exact.username.trim()
      : null;
  if (!username) return null;
  return tryLogin(username);
}

async function fetchWordPressMe(baseUrl: string, token: string): Promise<WordPressMeResponse | null> {
  const res = await fetch(`${baseUrl}/wp-json/wp/v2/users/me?context=edit`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return null;
  const json = (await res.json().catch(() => null)) as WordPressMeResponse | null;
  return json && typeof json === "object" ? json : null;
}

export async function authenticateWithWordPress(
  identifier: string,
  password: string
): Promise<
  | { ok: true; user: WordPressAuthUser }
  | {
      ok: false;
      reason: "not_configured" | "invalid_credentials" | "upstream_error" | "incomplete_profile";
      error: string;
    }
> {
  const baseUrl = getWordPressSiteBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      reason: "not_configured",
      error: "WordPress auth is not configured.",
    };
  }
  const idf = identifier.trim();
  const pwd = password.trim();
  if (!idf || !pwd) {
    return {
      ok: false,
      reason: "invalid_credentials",
      error: "Enter your WordPress email/username and password.",
    };
  }

  const jwtRes = await fetch(`${baseUrl}${getWordPressJwtPath()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: idf, password: pwd }),
    cache: "no-store",
  }).catch(() => null);

  if (!jwtRes) {
    return {
      ok: false,
      reason: "upstream_error",
      error: "Unable to reach WordPress auth endpoint.",
    };
  }

  const jwtJson = (await jwtRes.json().catch(() => null)) as WordPressJwtTokenResponse | null;
  const jwtUnavailable = jwtRes.status === 404;
  const jwtInvalidCreds = jwtRes.status === 401 || jwtRes.status === 403;
  if (!jwtRes.ok || !jwtJson?.token) {
    const formProfile = await authViaWordPressLoginForm(baseUrl, idf, pwd);
    if (formProfile) {
      let wordpressRole: string | null = null;
      const wooConfig = getWooCommerceConfig();
      if (wooConfig) {
        const byEmail = await fetchCustomersSearch(wooConfig, formProfile.email, {
          per_page: 100,
        });
        if (byEmail.ok) {
          const exact = byEmail.data.find(
            (row) =>
              normalizeWordPressEmail(
                typeof row.email === "string" ? row.email : null
              ) === formProfile.email
          );
          wordpressRole = normalizeRole(exact?.role);
        }
      }
      return {
        ok: true,
        user: {
          wordpressUserId: formProfile.wordpressUserId,
          email: formProfile.email,
          displayName: formProfile.displayName,
          wordpressRole,
          isWordPressAdmin: isWpAdminRole(wordpressRole),
        },
      };
    }
    return {
      ok: false,
      reason: jwtInvalidCreds ? "invalid_credentials" : "upstream_error",
      error: jwtUnavailable
        ? "WordPress auth endpoint unavailable."
        : jwtInvalidCreds
          ? "Invalid credentials."
          : "WordPress authentication failed.",
    };
  }

  const me = await fetchWordPressMe(baseUrl, jwtJson.token);
  const normalizedEmail = normalizeWordPressEmail(me?.email ?? jwtJson.user_email);
  const wpUserIdRaw = me?.id ?? jwtJson.user_id;
  const wpUserId =
    typeof wpUserIdRaw === "number" ? wpUserIdRaw : parseInt(String(wpUserIdRaw ?? ""), 10);
  const directRole = Array.isArray(me?.roles) ? normalizeRole(me?.roles[0]) : null;

  let wordpressRole = directRole;
  if (!wordpressRole && normalizedEmail) {
    const wooConfig = getWooCommerceConfig();
    if (wooConfig) {
      const byEmail = await fetchCustomersSearch(wooConfig, normalizedEmail, { per_page: 100 });
      if (byEmail.ok) {
        const exact = byEmail.data.find(
          (row) => normalizeWordPressEmail(typeof row.email === "string" ? row.email : null) === normalizedEmail
        );
        wordpressRole = normalizeRole(exact?.role);
      }
    }
  }

  if (!normalizedEmail || !Number.isInteger(wpUserId) || wpUserId < 1) {
    return {
      ok: false,
      reason: "incomplete_profile",
      error: "WordPress auth succeeded but profile data is incomplete (missing id/email).",
    };
  }

  const displayName =
    (typeof me?.name === "string" && me.name.trim()) ||
    (typeof jwtJson.user_display_name === "string" && jwtJson.user_display_name.trim()) ||
    (typeof jwtJson.user_nicename === "string" && jwtJson.user_nicename.trim()) ||
    null;

  return {
    ok: true,
    user: {
      wordpressUserId: wpUserId,
      email: normalizedEmail,
      displayName,
      wordpressRole,
      isWordPressAdmin: isWpAdminRole(wordpressRole),
    },
  };
}
