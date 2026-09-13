export type DdayBadge =
  | { kind: "always"; label: "상시" }
  | { kind: "closed"; label: "마감" }
  | { kind: "dday"; label: `D-${number}` }
  | { kind: "hours"; label: `${number}시간 전` };

export function getDdayBadge(
  deadlineIso: string | null,
  now: Date = new Date()
): DdayBadge {
  if (!deadlineIso) return { kind: "always", label: "상시" };
  const deadline = new Date(deadlineIso);
  if (deadline.getTime() <= now.getTime()) return { kind: "closed", label: "마감" };

  const nowDay = toKstCalendarDay(now);
  const deadlineDay = toKstCalendarDay(deadline);
  const dayDiff = diffCalendarDays(deadlineDay, nowDay);

  if (dayDiff >= 1) return { kind: "dday", label: `D-${dayDiff}` };

  const hoursLeft = Math.max(
    1,
    Math.ceil((deadline.getTime() - now.getTime()) / 3_600_000)
  );
  return { kind: "hours", label: `${hoursLeft}시간 전` };
}

function toKstCalendarDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    date
  );
}

function diffCalendarDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000
  );
}
