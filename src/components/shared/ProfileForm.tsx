"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboarding } from "@/app/onboarding/actions";
import { Card, CardContent } from "@/components/ui/Card";
import { FITNESS_GOALS, PREFERRED_UNITS, PROFILE_GENDER_OPTIONS } from "@/lib/constants";
import type { Profile } from "@/types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
];

interface ProfileFormProps {
  profile: Profile | null;
  /** On success, redirect here (e.g. /dashboard for onboarding). If null, stay and show success. */
  redirectTo?: string | null;
  submitLabel?: string;
}

export function ProfileForm({
  profile,
  redirectTo = null,
  submitLabel = "Save changes",
}: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
    setLoading(true);
    const result = await saveOnboarding(form);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setSuccess(true);
      router.refresh();
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
            Profile saved.
          </div>
        )}
        <div>
          <label htmlFor="profile_full_name" className="block text-sm font-medium text-zinc-300 mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="profile_full_name"
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="profile_display_name" className="block text-sm font-medium text-zinc-300 mb-1">
            Display name <span className="text-red-500">*</span>
          </label>
          <input
            id="profile_display_name"
            type="text"
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
            placeholder="Name shown in the app"
          />
        </div>
        <div>
          <label htmlFor="profile_fitness_goal" className="block text-sm font-medium text-zinc-300 mb-1">
            Fitness goal
          </label>
          <select
            id="profile_fitness_goal"
            value={form.fitness_goal}
            onChange={(e) => setForm((p) => ({ ...p, fitness_goal: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
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
          <label htmlFor="profile_preferred_units" className="block text-sm font-medium text-zinc-300 mb-1">
            Preferred units
          </label>
          <select
            id="profile_preferred_units"
            value={form.preferred_units}
            onChange={(e) => setForm((p) => ({ ...p, preferred_units: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          >
            {PREFERRED_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profile_timezone" className="block text-sm font-medium text-zinc-300 mb-1">
            Timezone
          </label>
          <select
            id="profile_timezone"
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
          >
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profile_gender" className="block text-sm font-medium text-zinc-300 mb-1">
            Gender <span className="text-zinc-500 font-normal">(body diagram)</span>
          </label>
          <select
            id="profile_gender"
            value={form.gender}
            onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
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
          className="w-full rounded-lg bg-primary-500 hover:bg-primary-400 text-zinc-900 font-semibold py-2.5 text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </form>
    </Card>
  );
}
