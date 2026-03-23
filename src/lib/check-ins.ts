import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckIn } from "@/types";

/** Date string YYYY-MM-DD for today in UTC (or use local; we use UTC for consistency). */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getCheckIn(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<CheckIn | null> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .eq("check_in_date", date)
    .maybeSingle();
  if (error) return null;
  return data as CheckIn | null;
}

export async function getCheckInsInRange(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string
): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .gte("check_in_date", fromDate)
    .lte("check_in_date", toDate)
    .order("check_in_date", { ascending: false });
  if (error) return [];
  return (data ?? []) as CheckIn[];
}

export type CheckInUpsert = {
  routine_done: boolean;
  worked_out: boolean;
  note?: string | null;
};

export async function upsertCheckIn(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  payload: CheckInUpsert
): Promise<{ data: CheckIn | null; error: Error | null }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("check_ins")
    .upsert(
      {
        user_id: userId,
        check_in_date: date,
        routine_done: payload.routine_done,
        worked_out: payload.worked_out,
        note: payload.note ?? null,
        updated_at: now,
      },
      { onConflict: "user_id,check_in_date" }
    )
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as CheckIn, error: null };
}

export interface CheckInStreaks {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
}

/**
 * Compute check-in streaks from check_ins table.
 * Streak = consecutive calendar days with at least one check-in.
 * Current streak: from today (or yesterday if no check-in today) going backward.
 * Longest streak: max consecutive days in history.
 */
export async function getCheckInStreaks(
  supabase: SupabaseClient,
  userId: string
): Promise<CheckInStreaks> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("check_in_date")
    .eq("user_id", userId)
    .order("check_in_date", { ascending: false });
  if (error) {
    return { currentStreak: 0, longestStreak: 0, lastCheckInDate: null };
  }
  const dates = (data ?? []).map((r) => r.check_in_date as string);
  const daySet = new Set(dates);
  const sorted = Array.from(daySet).sort((a, b) => (b > a ? 1 : -1));
  const lastCheckInDate = sorted[0] ?? null;

  const today = todayDateString();
  let currentStreak = 0;
  const check = new Date(today + "T12:00:00Z");
  const startFromToday = daySet.has(today);
  if (!startFromToday) {
    check.setUTCDate(check.getUTCDate() - 1);
  }
  for (let i = 0; i < 366; i++) {
    const d = check.toISOString().slice(0, 10);
    if (daySet.has(d)) {
      currentStreak++;
      check.setUTCDate(check.getUTCDate() - 1);
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i]!;
    const prev = sorted[i - 1];
    if (!prev) {
      run = 1;
    } else {
      const prevDate = new Date(prev + "T12:00:00Z");
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      const expected = prevDate.toISOString().slice(0, 10);
      if (curr === expected) {
        run++;
      } else {
        run = 1;
      }
    }
    if (run > longestStreak) longestStreak = run;
  }

  return {
    currentStreak,
    longestStreak,
    lastCheckInDate,
  };
}
