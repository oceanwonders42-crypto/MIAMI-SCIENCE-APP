"use server";

import { randomUUID } from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { redeemPointsRpc, createLedgerEntry } from "@/lib/rewards";
import { REDEMPTION_OPTIONS, ROUTES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import {
  createWooCommerceCoupon,
  deleteWooCommerceCoupon,
  getWooCommerceConfig,
} from "@/lib/integrations/woocommerce-client";
import {
  buildWooCouponBody,
  generateRewardCouponCode,
  wooCouponBodyToRecord,
} from "@/lib/reward-redemption-woo";

export type RedeemPointsActionResult =
  | { success: true; couponCode: string }
  | { success: false; error: string };

export async function redeemPointsAction(optionId: string): Promise<RedeemPointsActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const option = REDEMPTION_OPTIONS.find((o) => o.id === optionId);
  if (!option) return { success: false, error: "Invalid redemption option." };

  const config = getWooCommerceConfig();
  if (!config) {
    return { success: false, error: "Store rewards are temporarily unavailable." };
  }

  const redemptionRef = randomUUID();
  const couponCode = generateRewardCouponCode();
  const wooBody = wooCouponBodyToRecord(
    buildWooCouponBody(option, couponCode, user.id, redemptionRef)
  );

  const created = await createWooCommerceCoupon(config, wooBody);
  if (!created.ok) {
    return { success: false, error: "Could not create store coupon. Try again later." };
  }

  const woo = created.data as { id?: number; code?: string };
  const wooCouponId = typeof woo.id === "number" ? woo.id : NaN;
  if (!Number.isInteger(wooCouponId) || wooCouponId < 1) {
    return { success: false, error: "Invalid coupon response from store." };
  }

  const finalCode =
    typeof woo.code === "string" && woo.code.trim() ? woo.code.trim().toUpperCase() : couponCode;

  const deduct = await redeemPointsRpc(supabase, {
    userId: user.id,
    optionId,
    points: option.points,
    reason: `Redeemed: ${option.label}`,
    description: `Coupon: ${finalCode}`,
    referenceId: redemptionRef,
  });

  if (deduct.error) {
    await deleteWooCommerceCoupon(config, wooCouponId);
    return { success: false, error: deduct.error.message };
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch {
    await deleteWooCommerceCoupon(config, wooCouponId);
    await createLedgerEntry(supabase, {
      user_id: user.id,
      amount_delta: option.points,
      reason: "redemption_refund",
      description: "Points restored — could not save redemption record",
      reference_type: "redemption_refund",
      reference_id: redemptionRef,
    });
    return { success: false, error: "Rewards service misconfigured." };
  }

  const { error: insError } = await service.from("reward_redemptions").insert({
    user_id: user.id,
    redemption_option_id: option.id,
    redemption_reference_id: redemptionRef,
    points_spent: option.points,
    coupon_code: finalCode,
    woo_coupon_id: wooCouponId,
    status: "issued",
  } as never);

  if (insError) {
    await deleteWooCommerceCoupon(config, wooCouponId);
    await createLedgerEntry(service, {
      user_id: user.id,
      amount_delta: option.points,
      reason: "redemption_refund",
      description: "Points restored — redemption record failed",
      reference_type: "redemption_refund",
      reference_id: redemptionRef,
    });
    return {
      success: false,
      error: "Could not finalize redemption. Your points were refunded.",
    };
  }

  revalidatePath(ROUTES.rewards);
  revalidatePath(ROUTES.dashboard);
  return { success: true, couponCode: finalCode };
}
