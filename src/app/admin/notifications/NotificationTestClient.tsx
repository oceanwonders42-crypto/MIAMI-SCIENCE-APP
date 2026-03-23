"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { loadNotificationPreview, sendTestNotification, type NotificationPreviewResult, type TestNotificationType } from "./actions";

export function NotificationTestClient() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<NotificationPreviewResult | null>(null);

  async function handleLoad() {
    const id = userId.trim();
    if (!id) {
      setError("Enter a user ID");
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);
    const result = await loadNotificationPreview(id);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreview(result.data);
  }

  async function handleSend(type: TestNotificationType) {
    const id = userId.trim();
    if (!id) return;
    setSendLoading(type);
    setError(null);
    setSendSuccess(null);
    const result = await sendTestNotification(id, type);
    setSendLoading(null);
    if (!result.ok) {
      setError(result.error);
    } else {
      setSendSuccess(type);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Look up user</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter a user ID (UUID from auth.users or profiles) to preview and test notifications.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="User ID (UUID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm min-w-[280px]"
            />
            <button
              type="button"
              onClick={handleLoad}
              disabled={loading}
              className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 text-sm disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load preview"}
            </button>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          {sendSuccess && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm p-3">
              Test {sendSuccess.replace("_", " ")} email sent.
            </div>
          )}
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Recipient: <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1">{preview.email}</code>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">What needs attention</p>
              {preview.attentionItems.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing</p>
              ) : (
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  {preview.attentionItems.map((i) => (
                    <li key={i.id}>
                      <span className="font-medium">{i.title}</span> — {i.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              {preview.reorderPayload && (
                <button
                  type="button"
                  onClick={() => handleSend("reorder")}
                  disabled={sendLoading !== null}
                  className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-medium py-2 px-3 text-sm disabled:opacity-50"
                >
                  {sendLoading === "reorder" ? "Sending…" : "Send test reorder email"}
                </button>
              )}
              {preview.comebackPayload && (
                <button
                  type="button"
                  onClick={() => handleSend("comeback")}
                  disabled={sendLoading !== null}
                  className="rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/30 text-primary-800 dark:text-primary-200 font-medium py-2 px-3 text-sm disabled:opacity-50"
                >
                  {sendLoading === "comeback" ? "Sending…" : "Send test comeback email"}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSend("weekly_recap")}
                disabled={sendLoading !== null}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium py-2 px-3 text-sm disabled:opacity-50"
              >
                {sendLoading === "weekly_recap" ? "Sending…" : "Send test weekly recap"}
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Emails are sent only when a transport (e.g. RESEND_API_KEY) is configured; otherwise they are logged.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
