"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAnnouncementPublishedAtAction } from "./actions";
import { ROUTES } from "@/lib/constants";
import type { Announcement } from "@/types";

export function AnnouncementRowActions({ announcement: a }: { announcement: Announcement }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function togglePublish() {
    setLoading(true);
    if (a.published_at) {
      await setAnnouncementPublishedAtAction(a.id, null);
    } else {
      await setAnnouncementPublishedAtAction(a.id, new Date().toISOString());
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`${ROUTES.adminAnnouncements}/${a.id}/edit`}
        className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline"
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={loading}
        onClick={() => void togglePublish()}
        className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline disabled:opacity-50"
      >
        {a.published_at ? "Unpublish" : "Publish"}
      </button>
    </div>
  );
}
