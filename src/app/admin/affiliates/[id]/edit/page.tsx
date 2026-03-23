import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { getAffiliateProfileById } from "@/lib/affiliates";
import { getProfile } from "@/lib/profile";
import { Header } from "@/components/layout/Header";
import { Section } from "@/components/ui/Section";
import { AffiliateEditForm } from "../../AffiliateEditForm";
import { ROUTES } from "@/lib/constants";

export default async function AdminAffiliateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") redirect(ROUTES.dashboard);

  const profile = await getAffiliateProfileById(supabase, id);
  if (!profile) notFound();
  const userProfile = await getProfile(supabase, profile.user_id);
  const display =
    userProfile?.display_name ?? userProfile?.full_name ?? profile.user_id.slice(0, 8);

  return (
    <>
      <Header
        title="Edit affiliate"
        subtitle={display}
      />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Affiliate profile">
          <AffiliateEditForm profile={profile} />
        </Section>
        <p className="text-sm">
          <Link href="/admin/affiliates" className="text-primary-600 hover:underline">
            ← Back to affiliates
          </Link>
        </p>
      </div>
    </>
  );
}
