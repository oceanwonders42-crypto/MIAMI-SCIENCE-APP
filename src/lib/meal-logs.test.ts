import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listMealLogs } from "@/lib/meal-logs";

function mockSupabaseMealLogsError(message: string): SupabaseClient {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () =>
      Promise.resolve({
        data: null,
        error: { message, code: "PGRST205" },
      }),
  };
  return {
    from: () => chain,
  } as unknown as SupabaseClient;
}

describe("listMealLogs", () => {
  it("returns loadError true when table missing or query fails", async () => {
    const r = await listMealLogs(mockSupabaseMealLogsError("Could not find the table"), "user-id");
    expect(r.loadError).toBe(true);
    expect(r.logs).toEqual([]);
  });

  it("returns logs when query succeeds", async () => {
    const row = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "u1",
      photo_storage_path: null,
      calories: 400,
      protein_g: 20,
      carbs_g: null,
      fat_g: null,
      notes: null,
      estimate_source: "manual",
      logged_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => Promise.resolve({ data: [row], error: null }),
    };
    const supabase = { from: () => chain } as unknown as SupabaseClient;
    const r = await listMealLogs(supabase, "u1");
    expect(r.loadError).toBe(false);
    expect(r.logs).toHaveLength(1);
    expect(r.logs[0]?.calories).toBe(400);
  });
});
