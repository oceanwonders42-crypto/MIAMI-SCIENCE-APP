"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  reEnableEmailNotificationsAction,
  saveNotificationPreferences,
} from "@/app/(dashboard)/account/actions";
import { isIOSCapacitor, registerNativePushIfPossible } from "@/lib/capacitor/native-push";
import type { NotificationPreferencesRow } from "@/lib/notification-preferences";

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferencesRow;
}

export function NotificationPreferencesForm({ preferences }: NotificationPreferencesFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reEnableLoading, setReEnableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    reorder_reminders: preferences.reorder_reminders,
    comeback_reminders: preferences.comeback_reminders,
    weekly_recap: preferences.weekly_recap,
    announcements: preferences.announcements,
    push_enabled: preferences.push_enabled,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await saveNotificationPreferences(form);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    if (form.push_enabled && isIOSCapacitor()) {
      void registerNativePushIfPossible();
    }
  }

  async function handleReEnableEmail() {
    setError(null);
    setReEnableLoading(true);
    const result = await reEnableEmailNotificationsAction();
    setReEnableLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function handleChange(key: keyof typeof form, value: boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const showPushRow = isIOSCapacitor();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Choose what you want to receive. Email is always used for reminders and your weekly recap. Push is available on
          the iOS app when you allow alerts.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
              Preferences saved.
            </div>
          )}
          {!preferences.email_enabled && (
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 text-amber-100 text-sm p-3 space-y-2">
              <p>You’ve unsubscribed from email notifications via an email link.</p>
              <button
                type="button"
                onClick={() => void handleReEnableEmail()}
                disabled={reEnableLoading}
                className="rounded-md bg-amber-700/80 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-medium py-1.5 px-3"
              >
                {reEnableLoading ? "Updating…" : "Re-enable emails"}
              </button>
            </div>
          )}
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50/50 dark:bg-zinc-900/40">
              Email is the required channel for reminders and recaps. To unsubscribe from emails, use the unsubscribe link
              in any email we send you.
            </p>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.reorder_reminders}
                onChange={(e) => handleChange("reorder_reminders", e.target.checked)}
                className="rounded border-zinc-700"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Reorder reminders
                <span className="block text-xs text-zinc-500 font-normal mt-0.5">
                  Low-supply push alerts use this too when Push is on (throttled ~once / 24h while low).
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.comeback_reminders}
                onChange={(e) => handleChange("comeback_reminders", e.target.checked)}
                className="rounded border-zinc-700"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Comeback reminders (check-in, workout)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.weekly_recap}
                onChange={(e) => handleChange("weekly_recap", e.target.checked)}
                className="rounded border-zinc-700"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Weekly recap</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.announcements}
                onChange={(e) => handleChange("announcements", e.target.checked)}
                className="rounded border-zinc-700"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Announcements</span>
            </label>
            {showPushRow && (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.push_enabled}
                  onChange={(e) => handleChange("push_enabled", e.target.checked)}
                  className="rounded border-zinc-700"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Push notifications (iOS — allow alerts when prompted)
                </span>
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2 px-4 text-sm"
          >
            {loading ? "Saving…" : "Save preferences"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
