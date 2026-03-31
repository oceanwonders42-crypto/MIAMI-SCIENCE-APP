import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRole, isAffiliateOrAdmin } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { getNotificationPreferences } from "@/lib/notification-preferences";
import { getAffiliateProfile } from "@/lib/affiliates";
import { getCustomerMappingByUserId } from "@/lib/customer-mapping";
import { getOrderCountForUser } from "@/lib/orders";
import { getPurchaseStatsForUser } from "@/lib/purchase-stats";
import { affiliateProvider } from "@/lib/integrations/affiliate-provider";
import { Header } from "@/components/layout/Header";
import { StoreAccountCard } from "@/components/account/StoreAccountCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { LogoutButton } from "./logout-button";
import { ProfileForm } from "@/components/shared/ProfileForm";
import { NotificationPreferencesForm } from "@/components/account/NotificationPreferencesForm";
import { ExerciseImageVariantForm } from "@/components/account/ExerciseImageVariantForm";
import { ROUTES, SHOP_REFILL_URL } from "@/lib/constants";

export default async function AccountPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const role = await getRole(supabase, user.id);
  const showAffiliate = isAffiliateOrAdmin(role);
  const [profile, notificationPrefs, affiliateProfile, profileView, storeMapping, orderCount, purchaseStats] =
    await Promise.all([
      getProfile(supabase, user.id),
      getNotificationPreferences(supabase, user.id),
      showAffiliate ? getAffiliateProfile(supabase, user.id) : Promise.resolve(null),
      showAffiliate
        ? affiliateProvider.getProfileView(
            supabase,
            user.id,
            process.env.NEXT_PUBLIC_APP_URL ?? SHOP_REFILL_URL
          )
        : Promise.resolve(null),
      getCustomerMappingByUserId(supabase, user.id),
      getOrderCountForUser(supabase, user.id),
      getPurchaseStatsForUser(supabase, user.id),
    ]);

  const compactStats =
    storeMapping && purchaseStats.totalOrders > 0
      ? {
          totalOrders: purchaseStats.totalOrders,
          totalSpentCents: purchaseStats.totalSpentCents,
          daysSinceLastOrder: purchaseStats.daysSinceLastOrder,
        }
      : null;

  return (
    <>
      <Header title="Account" subtitle="Settings" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Role">
          <Card>
            <CardContent className="py-3">
              <Badge variant="outline">{role}</Badge>
            </CardContent>
          </Card>
        </Section>
        {showAffiliate && (
          <Section title="Affiliate">
            <Card>
              <CardContent className="py-4 space-y-2">
                {affiliateProfile && (
                  <>
                    <p className="text-sm text-zinc-400">
                      Status: <Badge variant="outline">{affiliateProfile.status}</Badge>
                    </p>
                    {profileView?.referralLink && (
                      <p className="text-sm text-zinc-400 truncate">
                        Referral: <code className="text-xs">{profileView.referralLink}</code>
                      </p>
                    )}
                    {profileView?.couponCode ? (
                      <p className="text-sm text-zinc-400 truncate" data-testid="account-affiliate-promo">
                        Promo code:{" "}
                        <code className="text-xs text-amber-200/90">{profileView.couponCode}</code>
                      </p>
                    ) : null}
                    {profileView?.externalSync?.syncError ? (
                      <p className="text-xs text-amber-500/90 leading-snug">
                        Sync note: {profileView.externalSync.syncError}
                      </p>
                    ) : null}
                  </>
                )}
                <Link
                  href={ROUTES.affiliate}
                  className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Open affiliate dashboard →
                </Link>
              </CardContent>
            </Card>
          </Section>
        )}
        <Section title="Store account">
          <StoreAccountCard storeMapping={storeMapping} orderCount={orderCount} compactStats={compactStats} />
        </Section>
        <Section title="Cart">
          <Card>
            <CardContent className="py-3">
              <Link
                href={ROUTES.cart}
                className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                View cart →
              </Link>
            </CardContent>
          </Card>
        </Section>
        <Section title="Exercise images">
          <ExerciseImageVariantForm
            currentVariant={profile?.exercise_image_variant === "women" ? "women" : "men"}
          />
        </Section>
        <Section title="Profile">
          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-400">
              {user.email}
            </CardContent>
          </Card>
          <div className="mt-4">
            <ProfileForm profile={profile} redirectTo={null} submitLabel="Save profile" />
          </div>
        </Section>
        <Section title="Notifications">
          <NotificationPreferencesForm preferences={notificationPrefs} />
        </Section>
        <Section title="Security">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-zinc-400 mb-4">
                Change password and security options. (Password reset uses the forgot-password flow.)
              </p>
              <a
                href={ROUTES.forgotPassword}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Reset password
              </a>
            </CardContent>
          </Card>
        </Section>
        <Section title="Sign out">
          <LogoutButton />
        </Section>
      </div>
    </>
  );
}
