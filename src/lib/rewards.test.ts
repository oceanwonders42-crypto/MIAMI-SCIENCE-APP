import { describe, expect, it } from "vitest";
import { isQualifyingPurchaseStatus, pointsForOrderTotalCents } from "@/lib/rewards";

describe("rewards purchase earning helpers", () => {
  it("accepts qualifying paid statuses", () => {
    expect(isQualifyingPurchaseStatus("processing")).toBe(true);
    expect(isQualifyingPurchaseStatus("completed")).toBe(true);
    expect(isQualifyingPurchaseStatus(" Completed ")).toBe(true);
  });

  it("rejects non-qualifying statuses", () => {
    expect(isQualifyingPurchaseStatus("pending")).toBe(false);
    expect(isQualifyingPurchaseStatus("failed")).toBe(false);
    expect(isQualifyingPurchaseStatus("")).toBe(false);
    expect(isQualifyingPurchaseStatus(null)).toBe(false);
  });

  it("derives points as floor(dollars)", () => {
    expect(pointsForOrderTotalCents(0)).toBe(0);
    expect(pointsForOrderTotalCents(99)).toBe(0);
    expect(pointsForOrderTotalCents(100)).toBe(1);
    expect(pointsForOrderTotalCents(2599)).toBe(25);
    expect(pointsForOrderTotalCents(null)).toBe(0);
  });
});
