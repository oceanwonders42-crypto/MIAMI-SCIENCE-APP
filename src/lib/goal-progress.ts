/**
 * Progress toward a numeric goal from a baseline (0–100).
 * For weight loss: start > goal. For gain: start < goal.
 */
export function progressPercentTowardGoal(
  current: number,
  goal: number,
  start: number | null
): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(goal)) return null;
  if (start == null || !Number.isFinite(start)) return null;
  if (start === goal) return current === goal ? 100 : null;
  if (goal < start) {
    const total = start - goal;
    const done = start - current;
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
  }
  const total = goal - start;
  const done = current - start;
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}
