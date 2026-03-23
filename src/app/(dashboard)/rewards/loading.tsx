import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function RewardsLoading() {
  return <PageSkeleton title="Rewards" subtitle="Points and redemption" cards={3} />;
}
