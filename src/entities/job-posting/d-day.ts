export type DdayBadge =
  | { kind: "always"; label: "상시" }
  | { kind: "closed"; label: "마감" }
  | { kind: "dday"; label: `D-${number}` }
  | { kind: "hours"; label: `${number}시간 전` };

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export function getDdayBadge(
  deadlineIso: string | null,
  now: Date = new Date()
): DdayBadge {
  if (!deadlineIso) return { kind: "always", label: "상시" };
  const deadline = new Date(deadlineIso);
  const msLeft = deadline.getTime() - now.getTime();
  if (msLeft <= 0) return { kind: "closed", label: "마감" };

  if (msLeft <= DAY_MS) {
    const hoursLeft = Math.max(1, Math.ceil(msLeft / HOUR_MS));
    return { kind: "hours", label: `${hoursLeft}시간 전` };
  }

  const daysLeft = Math.floor(msLeft / DAY_MS);
  return { kind: "dday", label: `D-${daysLeft}` };
}
