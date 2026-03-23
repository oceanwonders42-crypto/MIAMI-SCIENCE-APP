import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getReorderReminderCandidates,
  getComebackReminderCandidates,
  getWeeklyRecapCandidates,
  getLowSupplyPushCandidates,
} from "./candidates";
import { getSupplies, isLowSupply } from "@/lib/supplies";
import { ROUTES } from "@/lib/constants";
import { getAttentionItems } from "@/lib/attention-items";
import { getWeeklyRecap } from "@/lib/weekly-recap";
import {
  buildReorderPayloadFromAttention,
  buildComebackPayloadFromAttention,
  buildWeeklyRecapPayload,
} from "./build-payloads";
import { buildReorderReminderEmail, buildComebackReminderEmail, buildWeeklyRecapEmail } from "./email-templates";
import { sendEmail } from "./email-service";
import { withNotificationEmailFooter } from "./email-unsubscribe";
import { sendPush, type PushMessage } from "./push-service";
import { hasReceivedWeeklyRecapThisWeek, insertNotificationLog } from "@/lib/notification-log";
import { getNotificationPreferences } from "@/lib/notification-preferences";
import type { WeeklyRecapPayload } from "./types";

export interface RunSummaryTypeCounts {
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
  /** For weekly_recap only: count skipped due to throttle (already sent this week). */
  throttled?: number;
}

export interface RunSummary {
  reorder: RunSummaryTypeCounts;
  comeback: RunSummaryTypeCounts;
  weekly_recap: RunSummaryTypeCounts;
  /** Push-only; throttled per user (see candidates). */
  low_supply_alert: RunSummaryTypeCounts;
}

/**
 * Run scheduled notifications: reorder reminders, comeback reminders, weekly recap (throttled).
 * Use with service role client. Logs all outcomes to notification_log.
 */
export async function runScheduledNotifications(
  supabase: SupabaseClient
): Promise<RunSummary> {
  const summary: RunSummary = {
    reorder: { candidates: 0, sent: 0, skipped: 0, failed: 0 },
    comeback: { candidates: 0, sent: 0, skipped: 0, failed: 0 },
    weekly_recap: { candidates: 0, sent: 0, skipped: 0, failed: 0, throttled: 0 },
    low_supply_alert: { candidates: 0, sent: 0, skipped: 0, failed: 0 },
  };

  const [reorderCandidates, comebackCandidates, recapCandidates, lowSupplyCandidates] = await Promise.all([
    getReorderReminderCandidates(supabase),
    getComebackReminderCandidates(supabase),
    getWeeklyRecapCandidates(supabase),
    getLowSupplyPushCandidates(supabase),
  ]);

  summary.reorder.candidates = reorderCandidates.length;
  summary.comeback.candidates = comebackCandidates.length;
  summary.weekly_recap.candidates = recapCandidates.length;
  summary.low_supply_alert.candidates = lowSupplyCandidates.length;

  for (const { userId } of reorderCandidates) {
    const result = await sendReorderReminder(supabase, userId);
    summary.reorder[result]++;
  }

  for (const { userId } of comebackCandidates) {
    const result = await sendComebackReminder(supabase, userId);
    summary.comeback[result]++;
  }

  for (const { userId } of recapCandidates) {
    const alreadySent = await hasReceivedWeeklyRecapThisWeek(supabase, userId);
    if (alreadySent) {
      summary.weekly_recap.skipped++;
      summary.weekly_recap.throttled = (summary.weekly_recap.throttled ?? 0) + 1;
      await insertNotificationLog(supabase, {
        user_id: userId,
        notification_type: "weekly_recap",
        channel: "email",
        status: "skipped",
        reason: "Already sent this week",
      });
      continue;
    }
    const result = await sendWeeklyRecap(supabase, userId);
    summary.weekly_recap[result]++;
  }

  for (const { userId } of lowSupplyCandidates) {
    const result = await sendLowSupplyAlert(supabase, userId);
    summary.low_supply_alert[result]++;
  }

  return summary;
}

type SendResult = "sent" | "skipped" | "failed";

async function maybeSendPushForUser(
  supabase: SupabaseClient,
  userId: string,
  notificationType:
    | "reorder_reminder"
    | "comeback_reminder"
    | "weekly_recap"
    | "low_supply_alert",
  message: PushMessage
): Promise<void> {
  try {
    const prefs = await getNotificationPreferences(supabase, userId);
    if (!prefs.push_enabled) return;
    const result = await sendPush(supabase, userId, message);
    if (result.kind === "delivered") {
      await insertNotificationLog(supabase, {
        user_id: userId,
        notification_type: notificationType,
        channel: "push",
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } else if (result.kind === "failed") {
      await insertNotificationLog(supabase, {
        user_id: userId,
        notification_type: notificationType,
        channel: "push",
        status: "failed",
        reason: result.error,
      });
    }
  } catch {
    // Graceful: never break cron if push path fails
  }
}

function weeklyRecapPushCopy(payload: WeeklyRecapPayload): PushMessage {
  const body = `${payload.workoutsThisWeek} workouts · ${payload.checkInsThisWeek} check-ins · streak ${payload.checkInStreak}d`;
  return {
    title: "Your weekly recap",
    body,
    data: {
      type: "weekly_recap",
      deepLink: "/dashboard",
    },
  };
}

async function getUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !user?.email) return null;
  return user.email;
}

async function sendReorderReminder(supabase: SupabaseClient, userId: string): Promise<SendResult> {
  const email = await getUserEmail(supabase, userId);
  if (!email) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "reorder_reminder",
      channel: "email",
      status: "skipped",
      reason: "No email",
    });
    return "skipped";
  }
  const items = await getAttentionItems(supabase, userId);
  const payload = buildReorderPayloadFromAttention(items);
  if (!payload) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "reorder_reminder",
      channel: "email",
      status: "skipped",
      reason: "No payload",
    });
    return "skipped";
  }
  const { subject, html: rawHtml } = buildReorderReminderEmail(payload);
  const html = await withNotificationEmailFooter(supabase, userId, rawHtml);
  const sendResult = await sendEmail({ to: email, subject, html });
  if (!sendResult.ok) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "reorder_reminder",
      channel: "email",
      status: "failed",
      reason: sendResult.error,
    });
    return "failed";
  }
  await insertNotificationLog(supabase, {
    user_id: userId,
    notification_type: "reorder_reminder",
    channel: "email",
    status: "sent",
    sent_at: new Date().toISOString(),
  });
  await maybeSendPushForUser(supabase, userId, "reorder_reminder", {
    title: payload.title,
    body: payload.message,
    data: {
      type: "reorder_reminder",
      deepLink: payload.ctaUrl,
    },
  });
  return "sent";
}

async function sendComebackReminder(supabase: SupabaseClient, userId: string): Promise<SendResult> {
  const email = await getUserEmail(supabase, userId);
  if (!email) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "comeback_reminder",
      channel: "email",
      status: "skipped",
      reason: "No email",
    });
    return "skipped";
  }
  const items = await getAttentionItems(supabase, userId);
  const payload = buildComebackPayloadFromAttention(items);
  if (!payload) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "comeback_reminder",
      channel: "email",
      status: "skipped",
      reason: "No payload",
    });
    return "skipped";
  }
  const { subject, html: rawHtml } = buildComebackReminderEmail(payload);
  const html = await withNotificationEmailFooter(supabase, userId, rawHtml);
  const sendResult = await sendEmail({ to: email, subject, html });
  if (!sendResult.ok) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "comeback_reminder",
      channel: "email",
      status: "failed",
      reason: sendResult.error,
    });
    return "failed";
  }
  await insertNotificationLog(supabase, {
    user_id: userId,
    notification_type: "comeback_reminder",
    channel: "email",
    status: "sent",
    sent_at: new Date().toISOString(),
  });
  await maybeSendPushForUser(supabase, userId, "comeback_reminder", {
    title: payload.title,
    body: payload.message,
    data: {
      type: "comeback_reminder",
      deepLink: payload.ctaUrl,
    },
  });
  return "sent";
}

async function sendLowSupplyAlert(supabase: SupabaseClient, userId: string): Promise<SendResult> {
  const supplies = await getSupplies(supabase, userId);
  const lows = supplies.filter(isLowSupply);
  if (lows.length === 0) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "low_supply_alert",
      channel: "push",
      status: "skipped",
      reason: "No longer low",
    });
    return "skipped";
  }
  const prefs = await getNotificationPreferences(supabase, userId);
  if (!prefs.push_enabled) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "low_supply_alert",
      channel: "push",
      status: "skipped",
      reason: "Push disabled",
    });
    return "skipped";
  }
  if (prefs.reorder_reminders === false) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "low_supply_alert",
      channel: "push",
      status: "skipped",
      reason: "Reorder reminders off",
    });
    return "skipped";
  }

  const first = lows[0]!.name;
  const body =
    lows.length === 1
      ? `${first} is at or below your alert threshold.`
      : `${lows.length} items are at or below threshold — e.g. ${first}.`;

  try {
    const result = await sendPush(supabase, userId, {
      title: "Low supply",
      body,
      data: {
        type: "low_supply_alert",
        deepLink: ROUTES.stack,
      },
    });
    if (result.kind === "delivered") {
      await insertNotificationLog(supabase, {
        user_id: userId,
        notification_type: "low_supply_alert",
        channel: "push",
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      return "sent";
    }
    if (result.kind === "skipped") {
      await insertNotificationLog(supabase, {
        user_id: userId,
        notification_type: "low_supply_alert",
        channel: "push",
        status: "skipped",
        reason: "APNs not configured or no iOS token",
      });
      return "skipped";
    }
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "low_supply_alert",
      channel: "push",
      status: "failed",
      reason: result.error,
    });
    return "failed";
  } catch (e) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "low_supply_alert",
      channel: "push",
      status: "failed",
      reason: e instanceof Error ? e.message : String(e),
    });
    return "failed";
  }
}

async function sendWeeklyRecap(supabase: SupabaseClient, userId: string): Promise<SendResult> {
  const email = await getUserEmail(supabase, userId);
  if (!email) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "weekly_recap",
      channel: "email",
      status: "skipped",
      reason: "No email",
    });
    return "skipped";
  }
  const data = await getWeeklyRecap(supabase, userId);
  const payload = buildWeeklyRecapPayload(data);
  const { subject, html: rawHtml } = buildWeeklyRecapEmail(payload);
  const html = await withNotificationEmailFooter(supabase, userId, rawHtml);
  const sendResult = await sendEmail({ to: email, subject, html });
  if (!sendResult.ok) {
    await insertNotificationLog(supabase, {
      user_id: userId,
      notification_type: "weekly_recap",
      channel: "email",
      status: "failed",
      reason: sendResult.error,
    });
    return "failed";
  }
  await insertNotificationLog(supabase, {
    user_id: userId,
    notification_type: "weekly_recap",
    channel: "email",
    status: "sent",
    sent_at: new Date().toISOString(),
  });
  await maybeSendPushForUser(supabase, userId, "weekly_recap", weeklyRecapPushCopy(payload));
  return "sent";
}
