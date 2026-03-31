/**
 * Maps app reward catalog entries to WooCommerce coupon payloads.
 * All coupon creation runs server-side via WooCommerce REST (Basic auth).
 */

import { randomBytes } from "node:crypto";
import type { RedemptionOption } from "@/lib/constants";

export type WooCouponCreateBody = {
  code: string;
  discount_type: "percent" | "fixed_cart";
  amount: string;
  free_shipping?: boolean;
  individual_use: boolean;
  usage_limit: number;
  usage_limit_per_user: number;
  date_expires?: string;
  limit_usage_to_x_items?: number;
  meta_data: Array<{ key: string; value: string }>;
};

/** Globally unique, human-safe coupon code for one-time rewards. */
export function generateRewardCouponCode(): string {
  return `MS-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function isoDateInMonths(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Build WooCommerce coupon body for a redemption option.
 * - Percent rewards use `discount_type: percent` and `amount` as the percentage string.
 * - Dollar-off rewards use `discount_type: fixed_cart` and `amount` as dollars.
 * - Free shipping sets `free_shipping: true` with zero cart discount.
 */
export function buildWooCouponBody(
  option: RedemptionOption,
  couponCode: string,
  appUserId: string,
  redemptionRef: string
): WooCouponCreateBody {
  const baseMeta = [
    { key: "ms_app_user_id", value: appUserId },
    { key: "ms_redemption_ref", value: redemptionRef },
    { key: "ms_reward_option_id", value: option.id },
  ];

  const w = option.woo;

  if (w.kind === "free_shipping") {
    return {
      code: couponCode,
      discount_type: "fixed_cart",
      amount: "0",
      free_shipping: true,
      individual_use: true,
      usage_limit: 1,
      usage_limit_per_user: 1,
      meta_data: baseMeta,
    };
  }

  if (w.kind === "fixed_cart") {
    const row: WooCouponCreateBody = {
      code: couponCode,
      discount_type: "fixed_cart",
      amount: String(w.amountDollars),
      individual_use: true,
      usage_limit: 1,
      usage_limit_per_user: 1,
      meta_data: baseMeta,
    };
    if (w.expiresInMonths != null) row.date_expires = isoDateInMonths(w.expiresInMonths);
    return row;
  }

  // percent
  const row: WooCouponCreateBody = {
    code: couponCode,
    discount_type: "percent",
    amount: String(w.amountPercent),
    individual_use: true,
    usage_limit: 1,
    usage_limit_per_user: 1,
    meta_data: baseMeta,
  };
  if (w.expiresInMonths != null) row.date_expires = isoDateInMonths(w.expiresInMonths);
  if (w.limitUsageToXItems != null) row.limit_usage_to_x_items = w.limitUsageToXItems;
  return row;
}

/** Strip undefined for JSON; WooCommerce ignores unknown keys if we only send documented fields. */
export function wooCouponBodyToRecord(body: WooCouponCreateBody): Record<string, unknown> {
  return { ...body } as Record<string, unknown>;
}
