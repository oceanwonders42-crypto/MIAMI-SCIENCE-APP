import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { provisionAffiliateViaOnboarding } from "@/lib/integrations/affiliate-provision";
import { suggestAlternatePromoCode } from "@/lib/affiliate-access";

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { promoCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const promoCode = typeof body.promoCode === "string" ? body.promoCode : "";
  if (!promoCode.trim()) {
    return NextResponse.json({ ok: false, error: "Promo code is required." }, { status: 400 });
  }

  try {
    const service = createServiceRoleClient();
    const { data: session } = await service
      .from("affiliate_onboarding_sessions")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Enter the valid unlock code on this page first." },
        { status: 403 }
      );
    }

    const email = user.email ?? "";
    const result = await provisionAffiliateViaOnboarding({
      serviceSb: service,
      userId: user.id,
      email,
      promoCodeRaw: promoCode,
    });

    if (!result.ok) {
      const suggest =
        /already|used/i.test(result.error) ? suggestAlternatePromoCode(promoCode) : undefined;
      return NextResponse.json(
        { ok: false, error: result.error, suggestedCode: suggest },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      promoCode: result.promoCode,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Server configuration error." },
      { status: 500 }
    );
  }
}
