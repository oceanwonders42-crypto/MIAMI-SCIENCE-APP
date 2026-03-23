"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "./actions";
import { ROUTES } from "@/lib/constants";
import type { Announcement } from "@/types";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalToIso(val: string): string | null {
  const t = val.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function AnnouncementEditor({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Announcement | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [publishedLocal, setPublishedLocal] = useState(
    toDatetimeLocalValue(initial?.published_at ?? null)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(publishedIso: string | null) {
    setError(null);
    setLoading(true);
    if (mode === "create") {
      const r = await createAnnouncementAction({
        title,
        body,
        publishedAtIso: publishedIso,
      });
      setLoading(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push(ROUTES.adminAnnouncements);
      router.refresh();
      return;
    }
    if (!initial?.id) return;
    const r = await updateAnnouncementAction(initial.id, {
      title,
      body,
      publishedAtIso: publishedIso,
    });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this announcement permanently?")) return;
    setLoading(true);
    const r = await deleteAnnouncementAction(initial.id);
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push(ROUTES.adminAnnouncements);
    router.refresh();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const iso = fromDatetimeLocalToIso(publishedLocal);
    void handleSave(iso);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{mode === "create" ? "New announcement" : "Edit announcement"}</CardTitle>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Body supports HTML (e.g. <code className="text-xs">&lt;p&gt;</code>,{" "}
          <code className="text-xs">&lt;strong&gt;</code>, links). Shown on the dashboard when published.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm p-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body (HTML)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono"
              placeholder="<p>Your message…</p>"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Publish date / time (local)</label>
            <input
              type="datetime-local"
              value={publishedLocal}
              onChange={(e) => setPublishedLocal(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Clear the field and save as draft (unpublished). Future dates schedule visibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2 px-4 text-sm"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setPublishedLocal(toDatetimeLocalValue(new Date().toISOString()));
                void handleSave(new Date().toISOString());
              }}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 py-2 px-4 text-sm"
            >
              Publish now
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setPublishedLocal("");
                void handleSave(null);
              }}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 py-2 px-4 text-sm"
            >
              Save as draft
            </button>
            {mode === "edit" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleDelete()}
                className="rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 py-2 px-4 text-sm ml-auto"
              >
                Delete
              </button>
            )}
            <Link
              href={ROUTES.adminAnnouncements}
              className="rounded-lg py-2 px-4 text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
