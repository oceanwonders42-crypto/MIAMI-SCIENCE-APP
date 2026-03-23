import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Announcement } from "@/types";

interface AnnouncementsBlockProps {
  announcements: Announcement[];
}

export function AnnouncementsBlock({ announcements }: AnnouncementsBlockProps) {
  if (announcements.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Announcements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="border-b border-zinc-100 dark:border-zinc-700 last:border-0 last:pb-0 pb-4">
            <p className="font-medium text-sm">{a.title}</p>
            {a.body && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">
                {a.body}
              </p>
            )}
            {a.published_at && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                {new Date(a.published_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
