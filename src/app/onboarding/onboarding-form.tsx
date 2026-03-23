"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboarding } from "./actions";
import { Card, CardContent } from "@/components/ui/Card";
import { FITNESS_GOALS, PREFERRED_UNITS, PROFILE_GENDER_OPTIONS, ROUTES } from "@/lib/constants";
import type { Profile } from "@/types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
];

interface OnboardingFormProps {
  profile: Profile | null;
}

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    full_name: string;
    display_name: string;
    fitness_goal: string;
    preferred_units: string;
    timezone: string;
    gender: string;
  }>({
    full_name: (profile?.full_name ?? "").trim(),
    display_name: (profile?.display_name ?? "").trim(),
    fitness_goal: profile?.fitness_goal ?? "",
    preferred_units: profile?.preferred_units ?? "metric",
    timezone: profile?.timezone ?? "America/New_York",
    gender: profile?.gender ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await saveOnboarding(form);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(ROUTES.dashboard);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium mb-1">
            Display name <span className="text-red-500">*</span>
          </label>
          <input
            id="display_name"
            type="text"
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Name shown in the app"
          />
        </div>
        <div>
          <label htmlFor="fitness_goal" className="block text-sm font-medium mb-1">
            Fitness goal
          </label>
          <select
            id="fitness_goal"
            value={form.fitness_goal}
            onChange={(e) => setForm((p) => ({ ...p, fitness_goal: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select...</option>
            {FITNESS_GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="preferred_units" className="block text-sm font-medium mb-1">
            Preferred units
          </label>
          <select
            id="preferred_units"
            value={form.preferred_units}
            onChange={(e) => setForm((p) => ({ ...p, preferred_units: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {PREFERRED_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1">
            Gender <span className="text-zinc-400 font-normal">(body diagram)</span>
          </label>
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {PROFILE_GENDER_OPTIONS.map((o) => (
              <option key={o.value || "unset"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Complete setup"}
        </button>
      </form>
    </Card>
  );
}
