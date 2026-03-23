import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { ROUTES } from "@/lib/constants";
import { RewardsAdjustForm } from "./RewardsAdjustForm";

export default function AdminRewardsPage() {
  return (
    <>
      <Header title="Reward points" subtitle="Manual ledger adjustments (admin)" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Section title="Adjust balance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add or remove points</CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Creates a row in <code className="text-xs">reward_points_ledger</code>. Use a negative delta to deduct.
                User balance is the sum of all <code className="text-xs">amount_delta</code> values.
              </p>
            </CardHeader>
            <CardContent>
              <RewardsAdjustForm />
            </CardContent>
          </Card>
        </Section>
        <p className="text-sm">
          <Link href={ROUTES.admin} className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to admin
          </Link>
        </p>
      </div>
    </>
  );
}
