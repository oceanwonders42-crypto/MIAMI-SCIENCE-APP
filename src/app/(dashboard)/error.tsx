"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error.message, error.digest);
  }, [error]);

  return (
    <>
      <Header title="Something went wrong" subtitle="An error occurred" />
      <div className="px-4 md:px-6 space-y-6 pb-8">
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="py-6 space-y-4">
            <p className="text-sm text-zinc-400">
              We couldn’t load this page. You can try again or return to the dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 px-4 text-sm transition-colors"
              >
                Try again
              </button>
              <Link
                href={ROUTES.dashboard}
                className="rounded-lg border border-zinc-700 py-2.5 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
