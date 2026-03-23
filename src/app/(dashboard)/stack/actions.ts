"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  createSupply,
  updateSupplyCount,
  updateSupply,
  deleteSupply,
} from "@/lib/supplies";
import { calendarDateInTimeZone } from "@/lib/calendar-date";
import { upsertSupplyDailyTaken } from "@/lib/supply-daily-logs";
import { updateProfile } from "@/lib/profile";
import { markShipmentInventoryUpdated } from "@/lib/shipment-inventory";
import { revalidatePath } from "next/cache";

export async function createSupplyAction(
  form: {
    name: string;
    unit: string;
    current_count: number;
    starting_quantity?: number | null;
    threshold_alert?: number | null;
    daily_use_estimate?: number | null;
    label_strength?: string | null;
    notes?: string | null;
  },
  shipmentId?: string | null
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const name = form.name.trim();
  if (!name) return { success: false, error: "Name is required" };
  const current = Number(form.current_count);
  if (!Number.isFinite(current) || current < 0)
    return { success: false, error: "Current quantity must be 0 or more" };

  const { data, error } = await createSupply(supabase, {
    user_id: user.id,
    name,
    unit: form.unit.trim() || "units",
    current_count: current,
    starting_quantity: form.starting_quantity ?? current,
    threshold_alert: form.threshold_alert ?? null,
    daily_use_estimate: form.daily_use_estimate ?? null,
    label_strength: form.label_strength?.trim() || null,
    notes: form.notes?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  if (shipmentId) {
    await markShipmentInventoryUpdated(supabase, shipmentId, user.id);
    revalidatePath("/orders");
    revalidatePath("/dashboard");
  }
  revalidatePath("/stack");
  revalidatePath("/dashboard");
  return { success: true, id: data!.id };
}

/** Add quantity to an existing supply and optionally mark a shipment as inventory-updated. */
export async function addSupplyQuantityFromShipmentAction(
  supplyId: string,
  quantityToAdd: number,
  shipmentId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const add = Math.floor(Number(quantityToAdd));
  if (!Number.isFinite(add) || add < 1) return { success: false, error: "Enter a valid quantity (1 or more)." };

  const { data: supply } = await supabase
    .from("supplies")
    .select("current_count")
    .eq("id", supplyId)
    .eq("user_id", user.id)
    .single();
  if (!supply) return { success: false, error: "Supply not found." };
  const newCount = (supply as { current_count: number }).current_count + add;
  const { error } = await updateSupplyCount(supabase, supplyId, user.id, newCount);
  if (error) return { success: false, error: error.message };
  await markShipmentInventoryUpdated(supabase, shipmentId, user.id);
  revalidatePath("/stack");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

/** One-tap adjust quantity (e.g. −1 after a dose). Clamped at 0. */
export async function adjustSupplyCountDeltaAction(
  supplyId: string,
  delta: number
): Promise<{ success: true; current_count: number } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const d = Math.trunc(Number(delta));
  if (!Number.isFinite(d) || d === 0) return { success: false, error: "Invalid adjustment." };

  const { data: row, error: fetchErr } = await supabase
    .from("supplies")
    .select("current_count")
    .eq("id", supplyId)
    .eq("user_id", user.id)
    .single();
  if (fetchErr || !row) return { success: false, error: "Supply not found." };
  const next = Math.max(0, (row as { current_count: number }).current_count + d);
  const { error } = await updateSupplyCount(supabase, supplyId, user.id, next);
  if (error) return { success: false, error: error.message };
  revalidatePath("/stack");
  revalidatePath("/dashboard");
  return { success: true, current_count: next };
}

export async function toggleSupplyDailyTakenAction(
  supplyId: string,
  taken: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: supply, error: sErr } = await supabase
    .from("supplies")
    .select("id")
    .eq("id", supplyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (sErr || !supply) return { success: false, error: "Supply not found." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("user_id", user.id)
    .maybeSingle();
  const tz = (profile as { timezone: string | null } | null)?.timezone?.trim() || "America/New_York";
  const logDate = calendarDateInTimeZone(tz);

  const { error } = await upsertSupplyDailyTaken(supabase, user.id, supplyId, logDate, taken);
  if (error) return { success: false, error: error.message };
  revalidatePath("/stack");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSupplyCountAction(
  supplyId: string,
  current_count: number
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { error } = await updateSupplyCount(
    supabase,
    supplyId,
    user.id,
    current_count
  );
  if (error) return { success: false, error: error.message };
  revalidatePath("/stack");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSupplyAction(
  supplyId: string,
  form: {
    name: string;
    unit: string;
    current_count: number;
    starting_quantity?: number | null;
    threshold_alert?: number | null;
    daily_use_estimate?: number | null;
    label_strength?: string | null;
    notes?: string | null;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const name = form.name.trim();
  if (!name) return { success: false, error: "Name is required" };
  const current = Number(form.current_count);
  if (!Number.isFinite(current) || current < 0)
    return { success: false, error: "Current quantity must be 0 or more" };
  const { error } = await updateSupply(supabase, supplyId, user.id, {
    name,
    unit: form.unit.trim() || "units",
    current_count: current,
    starting_quantity: form.starting_quantity ?? undefined,
    threshold_alert: form.threshold_alert ?? undefined,
    daily_use_estimate: form.daily_use_estimate ?? undefined,
    label_strength: form.label_strength?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/stack");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Update profile height (cm) for BMI display only. Not used for any recommendation. */
export async function updateProfileHeightAction(
  height_cm: number | null
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (height_cm != null && (Number.isNaN(height_cm) || height_cm <= 0 || height_cm > 300))
    return { success: false, error: "Height must be between 1 and 300 cm." };
  const { error } = await updateProfile(supabase, user.id, { height_cm: height_cm ?? undefined });
  if (error) return { success: false, error: error.message };
  revalidatePath("/stack");
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSupplyAction(
  supplyId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const { error } = await deleteSupply(supabase, supplyId, user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/stack");
  revalidatePath("/dashboard");
  return { success: true };
}
