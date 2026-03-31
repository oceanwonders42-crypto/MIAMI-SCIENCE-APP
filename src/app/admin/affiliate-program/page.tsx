import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getAffiliateProgramSettings } from "@/lib/affiliate-program-settings";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { AffiliateProgramDefaultsForm } from "./AffiliateProgramDefaultsForm";

export default async function AdminAffiliateProgramPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const settings = await getAffiliateProgramSettings(supabase);

  return (
    <>
      <Header title="Affiliate program" subtitle="Default coupon discount & commission" />
      <div className="px-4 md:px-6 space-y-6 pb-8 max-w-xl">
        <Section title="Defaults for new affiliates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program-wide percentages</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Used for ULTRA self-serve onboarding and as fallbacks when a profile omits per-affiliate
                values. Per-affiliate overrides live on each affiliate record (Admin → Affiliates →
                Edit).
              </p>
            </CardHeader>
            <CardContent>
              <AffiliateProgramDefaultsForm
                defaultCouponDiscountPercent={Number(settings.default_coupon_discount_percent)}
                defaultCommissionPercent={Number(settings.default_commission_percent)}
              />
            </CardContent>
          </Card>
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.admin} className="text-primary-600 hover:underline">
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}
