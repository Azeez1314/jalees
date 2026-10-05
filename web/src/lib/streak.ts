/** UTC calendar day as YYYY-MM-DD (the same day boundary the voice cap uses). */
export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function previousDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return utcDay(new Date(Date.UTC(y, m - 1, d - 1)));
}

/**
 * Consecutive days of practice ending today — or yesterday, so a learner who hasn't practised *yet today* still sees their
 * streak instead of a zero. `days` = distinct UTC days (YYYY-MM-DD) on which the learner sent at least one message.
 */
export function computeStreak(days: string[], today: string = utcDay()): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : previousDay(today);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}
