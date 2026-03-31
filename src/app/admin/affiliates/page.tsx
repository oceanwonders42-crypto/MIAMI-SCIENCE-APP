import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getAllAffiliateProfiles } from "@/lib/affiliates";
import { getProfilesByUserIds } from "@/lib/profile";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { AffiliateForm } from "./AffiliateForm";
import { ROUTES } from "@/lib/constants";

export default async function AdminAffiliatesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const profiles = await getAllAffiliateProfiles(supabase);
  const userIds = [...new Set(profiles.map((p) => p.user_id))];
  const profileList = await getProfilesByUserIds(supabase, userIds);
  const profileMap: Record<string, { display_name: string | null; full_name: string | null }> = {};
  for (const p of profileList) {
    profileMap[p.user_id] = { display_name: p.display_name, full_name: p.full_name };
  }

  return (
    <>
      <Header title="Affiliates" subtitle="Manage affiliate profiles" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Add affiliate">
          <AffiliateForm />
        </Section>
        <Section title="Affiliate list">
          {profiles.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No affiliate profiles yet. Add one above (use User ID from Supabase Auth).
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {profiles.map((p) => {
                const display =
                  profileMap[p.user_id]?.display_name ??
                  profileMap[p.user_id]?.full_name ??
                  p.user_id.slice(0, 8);
                return (
                  <li key={p.id}>
                    <Card>
                      <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div>
                            <span className="font-medium">{display}</span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-sm ml-2">
                              ref: {p.referral_code}
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {p.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
                            promo: {p.coupon_code ?? "—"} · SliceWP:{" "}
                            {p.slicewp_affiliate_id ?? "—"} · Woo coupon id: {p.woo_coupon_id ?? "—"}
                          </p>
                        </div>
                        <Link
                          href={`/admin/affiliates/${p.id}/edit`}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Edit
                        </Link>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
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
