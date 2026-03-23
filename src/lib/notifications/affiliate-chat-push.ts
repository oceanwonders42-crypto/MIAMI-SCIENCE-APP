import { createServiceRoleClient } from "@/lib/supabase/service";
import { sendPush } from "@/lib/notifications/push-service";
/**
 * Notify other affiliates/admins (push_enabled) when a new affiliate-room message is posted.
 * Best-effort; never throws to callers.
 */
export async function notifyAffiliateChatRecipients(params: {
  senderId: string;
  preview: string;
}): Promise<void> {
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return;
  }

  const { data: roleRows, error: rolesErr } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["affiliate", "admin"]);

  if (rolesErr || !roleRows?.length) return;

  const rows = roleRows as { user_id: string }[];
  const unique = [
    ...new Set(
      rows
        .map((r) => r.user_id)
        .filter((id) => id && id !== params.senderId)
    ),
  ];

  if (unique.length === 0) return;

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, push_enabled")
    .in("user_id", unique);

  const prefRows = (prefs ?? []) as {
    user_id: string;
    push_enabled: boolean | null;
  }[];
  const prefMap = new Map<string, boolean>();
  for (const p of prefRows) {
    prefMap.set(p.user_id, p.push_enabled === true);
  }

  const body =
    params.preview.trim().slice(0, 120) ||
    "New message in the affiliate team chat.";

  for (const userId of unique) {
    if (prefMap.get(userId) === false) continue;
    await sendPush(supabase, userId, {
      title: "Team chat",
      body,
      data: {
        type: "affiliate_chat",
        path: "/community?room=affiliates",
      },
    });
  }
}
