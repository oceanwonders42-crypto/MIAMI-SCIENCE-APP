import { createServerClient } from "@/lib/supabase/server";
import {
  getRewardBalance,
  getRewardLedger,
  getLifetimeEarned,
  listRewardRedemptions,
} from "@/lib/rewards";
import { getRole, isAffiliateOrAdmin } from "@/lib/auth";
import { getAffiliateReferralOrderCount } from "@/lib/affiliate-dashboard";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Stats } from "@/components/ui/Stats";
import { RedemptionBlock } from "./RedemptionBlock";
import { HowToEarnSection } from "@/components/rewards/HowToEarnSection";
import { AffiliateRewardsSection } from "@/components/rewards/AffiliateRewardsSection";
import { RewardsHistoryTimeline } from "@/components/rewards/RewardsHistoryTimeline";
import { IssuedCouponsPanel } from "@/components/rewards/IssuedCouponsPanel";
import { Disclaimer } from "@/components/ui/Disclaimer";

export default async function RewardsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  const role = await getRole(supabase, userId);
  const showAffiliateRewards = isAffiliateOrAdmin(role);

  const [balance, lifetimeEarned, ledger, referralCount, redemptions] = await Promise.all([
    getRewardBalance(supabase, userId),
    getLifetimeEarned(supabase, userId),
    getRewardLedger(supabase, userId, 60),
    showAffiliateRewards ? getAffiliateReferralOrderCount(supabase, userId) : Promise.resolve(0),
    userId ? listRewardRedemptions(supabase, userId) : Promise.resolve([]),
  ]);

  return (
    <>
      <Header title="Rewards" subtitle="Earn points, unlock perks, redeem when you’re ready" />
      <div className="px-4 md:px-6 space-y-8 pb-8">
        <Section title="Your balance">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-primary-500/20 bg-primary-950/10">
              <CardContent className="pt-4">
                <Stats label="Available points" value={balance} />
                <p className="text-xs text-zinc-500 mt-1">Redeem below</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800">
              <CardContent className="pt-4">
                <Stats label="Lifetime earned" value={lifetimeEarned} />
                <p className="text-xs text-zinc-500 mt-1">All-time total</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="How to earn">
          <HowToEarnSection />
        </Section>

        <Section title="Redeem rewards">
          <RedemptionBlock balance={balance} />
        </Section>

        <Section title="Issued coupons">
          <IssuedCouponsPanel rows={redemptions} />
        </Section>

        {showAffiliateRewards && <AffiliateRewardsSection referralCount={referralCount} />}

        <Section title="Rewards history">
          <Card className="border-zinc-800 bg-zinc-950/40">
            <CardContent className="p-4 md:p-6">
              <RewardsHistoryTimeline entries={ledger} />
            </CardContent>
          </Card>
        </Section>

        <Section title="Fine print">
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardContent className="py-4 text-sm text-zinc-500 space-y-2">
              <p>
                Points and redemptions are subject to Miami Science program terms. Activity may take
                time to appear. Questions? Contact Miami Science support.
              </p>
            </CardContent>
          </Card>
        </Section>

        <Disclaimer compact className="text-center" />
      </div>
    </>
  );
}
