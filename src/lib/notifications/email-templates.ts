import { APP_NAME } from "@/lib/constants";
import type { ReorderReminderPayload, ComebackReminderPayload, WeeklyRecapPayload, RenderedEmail } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function wrapHtml(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#333;max-width:560px;margin:0 auto;padding:16px;">${body}</body></html>`;
}

function linkButton(label: string, url: string): string {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  return `<p style="margin-top:20px;"><a href="${fullUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:500;">${label}</a></p>`;
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * Append legal one-click unsubscribe link before </body>. Pass absolute https URL to /api/unsubscribe.
 */
export function appendUnsubscribeFooter(html: string, unsubscribeAbsoluteUrl: string): string {
  const footer = `<p style="margin-top:28px;font-size:0.75rem;color:#888;border-top:1px solid #eee;padding-top:14px;text-align:center;"><a href="${escapeHtmlAttr(unsubscribeAbsoluteUrl)}" style="color:#64748b;">Unsubscribe from these emails</a></p>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }
  return `${html}${footer}`;
}

/**
 * Build reorder reminder email content.
 */
export function buildReorderReminderEmail(payload: ReorderReminderPayload): RenderedEmail {
  const fullCtaUrl = payload.ctaUrl.startsWith("http") ? payload.ctaUrl : `${BASE_URL}${payload.ctaUrl}`;
  const body = `
    <h2 style="font-size:1.25rem;margin-bottom:8px;">${payload.title}</h2>
    <p>${payload.message}</p>
    ${linkButton(payload.ctaLabel, fullCtaUrl)}
    <p style="margin-top:24px;font-size:0.875rem;color:#666;">${APP_NAME} — refill reminder</p>
  `;
  return {
    subject: `${APP_NAME}: ${payload.title}`,
    html: wrapHtml(body.trim()),
  };
}

/**
 * Build comeback reminder email content.
 */
export function buildComebackReminderEmail(payload: ComebackReminderPayload): RenderedEmail {
  const fullCtaUrl = payload.ctaUrl.startsWith("http") ? payload.ctaUrl : `${BASE_URL}${payload.ctaUrl}`;
  const body = `
    <h2 style="font-size:1.25rem;margin-bottom:8px;">${payload.title}</h2>
    <p>${payload.message}</p>
    ${linkButton(payload.ctaLabel, fullCtaUrl)}
    <p style="margin-top:24px;font-size:0.875rem;color:#666;">${APP_NAME}</p>
  `;
  return {
    subject: `${APP_NAME}: ${payload.title}`,
    html: wrapHtml(body.trim()),
  };
}

function refillLabel(urgency: WeeklyRecapPayload["refillUrgency"]): string {
  switch (urgency) {
    case "critical":
      return "Reorder now";
    case "low":
      return "Low supply";
    case "soon":
      return "Reorder soon";
    default:
      return "—";
  }
}

/**
 * Build weekly recap email content.
 */
export function buildWeeklyRecapEmail(payload: WeeklyRecapPayload): RenderedEmail {
  const body = `
    <h2 style="font-size:1.25rem;margin-bottom:8px;">Your week at a glance</h2>
    <p style="color:#666;font-size:0.875rem;">${payload.weekLabel}</p>
    <ul style="list-style:none;padding:0;margin:16px 0;">
      <li style="padding:4px 0;">Workouts this week: <strong>${payload.workoutsThisWeek}</strong></li>
      <li style="padding:4px 0;">Check-ins: <strong>${payload.checkInsThisWeek}</strong></li>
      <li style="padding:4px 0;">Check-in streak: <strong>${payload.checkInStreak} days</strong></li>
      <li style="padding:4px 0;">Workout streak: <strong>${payload.workoutStreak} days</strong></li>
      <li style="padding:4px 0;">Low supply items: <strong>${payload.lowSupplyCount}</strong></li>
      <li style="padding:4px 0;">Points: <strong>${payload.pointsBalance}</strong> (${payload.pointsChangeThisWeek >= 0 ? "+" : ""}${payload.pointsChangeThisWeek} this week)</li>
      ${payload.lastOrderDate ? `<li style="padding:4px 0;">Last order: ${payload.lastOrderDate}${payload.daysSinceLastOrder != null ? ` (${payload.daysSinceLastOrder} days ago)` : ""}</li>` : ""}
      ${payload.refillUrgency !== "none" ? `<li style="padding:4px 0;">Refill: ${refillLabel(payload.refillUrgency)}</li>` : ""}
    </ul>
    ${linkButton("View dashboard", "/dashboard")}
    <p style="margin-top:24px;font-size:0.875rem;color:#666;">${APP_NAME} — weekly recap</p>
  `;
  return {
    subject: `${APP_NAME}: Your weekly recap`,
    html: wrapHtml(body.trim()),
  };
}
