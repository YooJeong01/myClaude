// KST(Asia/Seoul) has no daylight saving time, so UTC+9 is stable.
export function endOfDayKstToIso(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, 14, 59, 59);
  return new Date(utcMs).toISOString();
}
