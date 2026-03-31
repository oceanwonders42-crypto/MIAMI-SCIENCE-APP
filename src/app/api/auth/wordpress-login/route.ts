import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { authenticateWithWordPress } from "@/lib/integrations/wordpress-auth";
import { isSuperadminEmail } from "@/lib/superadmin-emails";
import { ensureAppAdminRole, upsertWordPressUserLink } from "@/lib/wordpress-user-link";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

async function findAuthUserByEmail(email: string): Promise<AuthUser | null> {
  const supabase = createServiceRoleClient();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const users = (data?.users ?? []) as AuthUser[];
    const hit = users.find((u) => (u.email ?? "").trim().toLowerCase() === email);
    if (hit) return hit;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAppUser(email: string, displayName: string | null): Promise<AuthUser | null> {
  const supabase = createServiceRoleClient();
  const existing = await findAuthUserByEmail(email);
  if (existing) return existing;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: displayName ? { full_name: displayName, name: displayName } : undefined,
  });
  if (error) return null;
  return (data?.user as AuthUser | undefined) ?? null;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { identifier?: string; password?: string }
    | null;
  const identifier = body?.identifier?.trim() ?? "";
  const password = body?.password ?? "";
  if (!identifier || !password) {
    return NextResponse.json(
      { ok: false, error: "Email/username and password are required." },
      { status: 400 }
    );
  }

  const wpAuth = await authenticateWithWordPress(identifier, password);
  if (!wpAuth.ok) {
    const status = wpAuth.reason === "invalid_credentials" ? 401 : 502;
    return NextResponse.json({ ok: false, error: wpAuth.error }, { status });
  }

  const supabase = createServiceRoleClient();
  const appUser = await ensureAppUser(wpAuth.user.email, wpAuth.user.displayName);
  if (!appUser?.id) {
    return NextResponse.json(
      { ok: false, error: "Could not create/link app user for this WordPress account." },
      { status: 500 }
    );
  }

  const linkRes = await upsertWordPressUserLink(supabase, {
    user_id: appUser.id,
    wordpress_user_id: wpAuth.user.wordpressUserId,
    wordpress_email: wpAuth.user.email,
    wordpress_role: wpAuth.user.wordpressRole,
    is_wordpress_admin: wpAuth.user.isWordPressAdmin,
    match_source: "manual",
  });
  if (!linkRes.ok) {
    return NextResponse.json(
      { ok: false, error: `WordPress link failed: ${linkRes.error}` },
      { status: 500 }
    );
  }

  if (wpAuth.user.isWordPressAdmin || isSuperadminEmail(wpAuth.user.email)) {
    const roleRes = await ensureAppAdminRole(supabase, appUser.id);
    if (!roleRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Admin role sync failed: ${roleRes.error}` },
        { status: 500 }
      );
    }
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`;
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: wpAuth.user.email,
    options: { redirectTo },
  });
  if (linkError) {
    return NextResponse.json(
      { ok: false, error: `Session bridge failed: ${linkError.message}` },
      { status: 500 }
    );
  }

  const otp = linkData?.properties?.email_otp ?? "";
  if (!otp) {
    return NextResponse.json(
      { ok: false, error: "Session bridge token was not generated." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    email: wpAuth.user.email,
    otp,
  });
}
