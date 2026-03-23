"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getRole } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { getAttentionItems } from "@/lib/attention-items";
import { getWeeklyRecap } from "@/lib/weekly-recap";
import {
  buildReorderPayloadFromAttention,
  buildComebackPayloadFromAttention,
  buildWeeklyRecapPayload,
} from "@/lib/notifications/build-payloads";
import { buildReorderReminderEmail, buildComebackReminderEmail, buildWeeklyRecapEmail } from "@/lib/notifications/email-templates";
import { sendEmail } from "@/lib/notifications/email-service";
import { withNotificationEmailFooter } from "@/lib/notifications/email-unsubscribe";
import { insertNotificationLog } from "@/lib/notification-log";
import type { AttentionItem } from "@/lib/attention-items";
import type { WeeklyRecapData } from "@/lib/weekly-recap";
import type { NotificationLogType } from "@/types/database";

export interface NotificationPreviewResult {
  email: string;
  attentionItems: AttentionItem[];
  weeklyRecap: WeeklyRecapData;
  reorderPayload: { title: string; message: string } | null;
  comebackPayload: { title: string; message: string } | null;
  hasRecap: true;
}

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  const role = await getRole(supabase, user.id);
  if (role !== "admin") {
    throw new Error("Admin only");
  }
}

/**
 * Load notification preview for a user (by ID). Uses service role to resolve email and data.
 */
export async function loadNotificationPreview(
  userId: string
): Promise<{ ok: true; data: NotificationPreviewResult } | { ok: false; error: string }> {
  await requireAdmin();
  const service = createServiceRoleClient();
  const {
    data: { user },
    error: userError,
  } = await service.auth.admin.getUserById(userId);
  if (userError || !user?.email) {
    return { ok: false, error: "User not found or has no email" };
  }
  const [attentionItems, weeklyRecap] = await Promise.all([
    getAttentionItems(service, userId),
    getWeeklyRecap(service, userId),
  ]);
  const reorderPayload = buildReorderPayloadFromAttention(attentionItems);
  const comebackPayload = buildComebackPayloadFromAttention(attentionItems);
  return {
    ok: true,
    data: {
      email: user.email,
      attentionItems,
      weeklyRecap,
      reorderPayload: reorderPayload ? { title: reorderPayload.title, message: reorderPayload.message } : null,
      comebackPayload: comebackPayload ? { title: comebackPayload.title, message: comebackPayload.message } : null,
      hasRecap: true,
    },
  };
}

export type TestNotificationType = "reorder" | "comeback" | "weekly_recap";

const TEST_REASON_SENT = "Test send (admin)";

function toLogType(type: TestNotificationType): NotificationLogType {
  switch (type) {
    case "reorder":
      return "reorder_reminder";
    case "comeback":
      return "comeback_reminder";
    case "weekly_recap":
      return "weekly_recap";
  }
}

/**
 * Send a test notification email for the given user and type. Logs to notification_log with reason "Test send (admin)".
 */
export async function sendTestNotification(
  userId: string,
  type: TestNotificationType
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const service = createServiceRoleClient();
  const {
    data: { user },
    error: userError,
  } = await service.auth.admin.getUserById(userId);
  if (userError || !user?.email) {
    return { ok: false, error: "User not found or has no email" };
  }
  const to = user.email;
  const logType = toLogType(type);

  if (type === "reorder") {
    const items = await getAttentionItems(service, userId);
    const payload = buildReorderPayloadFromAttention(items);
    if (!payload) return { ok: false, error: "No reorder reminder for this user" };
    const { subject, html } = buildReorderReminderEmail(payload);
    const result = await sendEmail({ to, subject, html });
    if (!result.ok) {
      await insertNotificationLog(service, {
        user_id: userId,
        notification_type: logType,
        channel: "email",
        status: "failed",
        reason: `Test send failed: ${result.error}`,
      });
      return { ok: false, error: result.error };
    }
    await insertNotificationLog(service, {
      user_id: userId,
      notification_type: logType,
      channel: "email",
      status: "sent",
      reason: TEST_REASON_SENT,
      sent_at: new Date().toISOString(),
    });
    return { ok: true };
  }

  if (type === "comeback") {
    const items = await getAttentionItems(service, userId);
    const payload = buildComebackPayloadFromAttention(items);
    if (!payload) return { ok: false, error: "No comeback reminder for this user" };
    const { subject, html: rawHtml } = buildComebackReminderEmail(payload);
    const html = await withNotificationEmailFooter(service, userId, rawHtml);
    const result = await sendEmail({ to, subject, html });
    if (!result.ok) {
      await insertNotificationLog(service, {
        user_id: userId,
        notification_type: logType,
        channel: "email",
        status: "failed",
        reason: `Test send failed: ${result.error}`,
      });
      return { ok: false, error: result.error };
    }
    await insertNotificationLog(service, {
      user_id: userId,
      notification_type: logType,
      channel: "email",
      status: "sent",
      reason: TEST_REASON_SENT,
      sent_at: new Date().toISOString(),
    });
    return { ok: true };
  }

  if (type === "weekly_recap") {
    const data = await getWeeklyRecap(service, userId);
    const payload = buildWeeklyRecapPayload(data);
    const { subject, html: rawHtml } = buildWeeklyRecapEmail(payload);
    const html = await withNotificationEmailFooter(service, userId, rawHtml);
    const result = await sendEmail({ to, subject, html });
    if (!result.ok) {
      await insertNotificationLog(service, {
        user_id: userId,
        notification_type: logType,
        channel: "email",
        status: "failed",
        reason: `Test send failed: ${result.error}`,
      });
      return { ok: false, error: result.error };
    }
    await insertNotificationLog(service, {
      user_id: userId,
      notification_type: logType,
      channel: "email",
      status: "sent",
      reason: TEST_REASON_SENT,
      sent_at: new Date().toISOString(),
    });
    return { ok: true };
  }

  return { ok: false, error: "Unknown type" };
}
