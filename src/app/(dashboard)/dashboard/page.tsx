import { createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { getRole, isAffiliateOrAdmin } from "@/lib/auth";
import { getWorkoutStats, getRecentWorkouts } from "@/lib/workouts";
import { getSupplies } from "@/lib/supplies";
import { getOrders } from "@/lib/orders";
import { getShipmentsForUser } from "@/lib/shipments";
import { getRewardBalance } from "@/lib/rewards";
import { getCheckIn, getCheckInStreaks, todayDateString } from "@/lib/check-ins";
import { getActiveAnnouncements } from "@/lib/announcements";
import { getAttentionItems } from "@/lib/attention-items";
import { getExercisePRs } from "@/lib/exercise-history";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Card, CardContent } from "@/components/ui/Card";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardWorkoutToday } from "@/components/dashboard/DashboardWorkoutToday";
import { DashboardAlertsCompact } from "@/components/dashboard/DashboardAlertsCompact";
import { DashboardExploreGrid } from "@/components/dashboard/DashboardExploreGrid";
import { StackOverviewBlock } from "@/components/dashboard/StackOverviewBlock";
import { OrdersOverviewBlock } from "@/components/dashboard/OrdersOverviewBlock";
import { CheckInCard } from "@/components/dashboard/CheckInCard";
import { OnboardingTutorialModal } from "@/components/dashboard/OnboardingTutorialModal";

/**
 * Home dashboard — premium gym aesthetic (hero → training focus → stack → check-in → alerts → orders → explore).
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";
  const role = await getRole(supabase, userId);
  const showAffiliateLinks = isAffiliateOrAdmin(role);

  const [
    profile,
    workoutStats,
    recentWorkouts,
    supplies,
    orders,
    shipments,
    rewardBalance,
    todayCheckIn,
    checkInStreaks,
    attentionItems,
    announcements,
    exercisePRs,
  ] = await Promise.all([
    getProfile(supabase, userId),
    getWorkoutStats(supabase, userId),
    getRecentWorkouts(supabase, userId, 1),
    getSupplies(supabase, userId),
    getOrders(supabase, userId, 5),
    getShipmentsForUser(supabase, userId),
    getRewardBalance(supabase, userId),
    getCheckIn(supabase, userId, todayDateString()),
    getCheckInStreaks(supabase, userId),
    getAttentionItems(supabase, userId),
    getActiveAnnouncements(supabase, 3),
    getExercisePRs(supabase, userId),
  ]);

  const displayName =
    (profile?.display_name ?? profile?.full_name ?? "there").trim() || "there";
  const deliveredNotAddedCount = attentionItems.filter((a) => a.type === "delivered_not_added").length;
  const recentPR = exercisePRs.length > 0 ? exercisePRs[0] : null;

  const showOnboardingTutorial =
    profile != null && profile.onboarding_tutorial_completed !== true;

  return (
    <div className="min-h-full bg-zinc-950 pb-28 md:pb-10">
      <OnboardingTutorialModal show={showOnboardingTutorial} />
      <DashboardHero
        displayName={displayName}
        workoutStats={workoutStats}
        checkInStreaks={checkInStreaks}
        rewardBalance={rewardBalance}
        recentPR={recentPR}
      />

      <div className="px-4 md:px-8 max-w-5xl mx-auto space-y-7 pt-8 md:pt-10">
        <DashboardWorkoutToday workoutStats={workoutStats} lastWorkout={recentWorkouts[0] ?? null} />

        <StackOverviewBlock supplies={supplies} variant="slim" />

        <div id="daily-checkin">
          <Card className="border-white/[0.07] bg-zinc-900/35">
            <CardContent className="p-4 sm:p-5">
              <CheckInCard todayCheckIn={todayCheckIn} embedded />
            </CardContent>
          </Card>
        </div>

        <DashboardAlertsCompact items={attentionItems} />

        <OrdersOverviewBlock
          orders={orders}
          shipments={shipments}
          deliveredNotAddedCount={deliveredNotAddedCount}
          variant="peek"
        />

        <DashboardExploreGrid showAffiliate={showAffiliateLinks} announcements={announcements} />

        <Disclaimer compact className="text-center pt-2 text-zinc-600 text-[11px] leading-relaxed" />
      </div>
    </div>
  );
}
