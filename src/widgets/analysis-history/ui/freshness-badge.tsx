import { formatRelativeDate } from "../lib/relative-date";

type FreshnessBadgeProps = {
  createdAt: string;
};

export function FreshnessBadge({ createdAt }: FreshnessBadgeProps) {
  return (
    <span className="w-fit rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {formatRelativeDate(createdAt)}
    </span>
  );
}
