import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole, isAffiliateOrAdmin } from "@/lib/auth";
import {
  getAffiliateChatUnreadCount,
  getAffiliateRoomId,
} from "@/lib/affiliate-chat";
import { getProfile, isProfileComplete } from "@/lib/profile";
import { getCustomerMappingByUserId } from "@/lib/customer-mapping";
import { tryAutoLinkCustomer } from "@/lib/integrations/auto-customer-link";
import { tryAutoLinkWordPressAdmin } from "@/lib/integrations/auto-wordpress-admin-link";
import { bootstrapAffiliateIdentityFromSliceEmail } from "@/lib/integrations/affiliate-identity-sync";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppNav } from "@/components/layout/AppNav";
import { ROUTES } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const profile = await getProfile(supabase, user.id);
  if (!isProfileComplete(profile)) redirect(ROUTES.onboarding);

  try {
    await supabase.rpc("claim_signup_bonus");
  } catch {
    /* Idempotent; ignore if RPC missing */
  }

  if (user.email) {
    try {
      const serviceClient = createServiceRoleClient();
      await tryAutoLinkWordPressAdmin(serviceClient, user.id, user.email);
    } catch {
      // Service role env missing or sync failed — do not break app shell
    }
  }

  const role = await getRole(supabase, user.id);

  let affiliateChatUnread = 0;
  if (isAffiliateOrAdmin(role)) {
    const affiliateRoomId = await getAffiliateRoomId(supabase);
    if (affiliateRoomId) {
      affiliateChatUnread = await getAffiliateChatUnreadCount(
        supabase,
        user.id,
        affiliateRoomId
      );
    }
  }

  const mapping = await getCustomerMappingByUserId(supabase, user.id);
  if (!mapping && user.email) {
    try {
      const serviceClient = createServiceRoleClient();
      await tryAutoLinkCustomer(serviceClient, user.id, user.email);
    } catch {
      // Service role env missing or auto-link failed — do not crash the layout
    }
  }

  if (user.email) {
    try {
      const serviceClient = createServiceRoleClient();
      await bootstrapAffiliateIdentityFromSliceEmail(
        serviceClient,
        user.id,
        user.email,
        role
      );
    } catch {
      // Service role env missing or SliceWP errors — shell must stay usable
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar role={role} affiliateChatUnread={affiliateChatUnread} />
      <main className="md:pl-56 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <Suspense fallback={<div className="h-14 border-t border-zinc-800 bg-zinc-900/95" aria-hidden />}>
          <AppNav
            role={role}
            variant="bottom"
            affiliateChatUnread={affiliateChatUnread}
          />
        </Suspense>
      </div>
    </div>
  );
}
