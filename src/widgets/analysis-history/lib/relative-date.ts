const formatter = new Intl.RelativeTimeFormat("ko", {
  numeric: "auto"
});

export function formatRelativeDate(value: string, now = new Date()): string {
  const date = new Date(value);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) {
    return "오늘";
  }
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, "day");
  }

  return formatter.format(Math.round(diffDays / 7), "week");
}
