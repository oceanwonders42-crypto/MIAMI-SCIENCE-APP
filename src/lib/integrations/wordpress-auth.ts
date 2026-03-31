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
  if (!jwtRes.ok || !jwtJson?.token) {
    return {
      ok: false,
      reason: jwtRes.status === 403 || jwtRes.status === 401 ? "invalid_credentials" : "upstream_error",
      error:
        jwtRes.status === 403 || jwtRes.status === 401
          ? "Invalid WordPress credentials."
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
