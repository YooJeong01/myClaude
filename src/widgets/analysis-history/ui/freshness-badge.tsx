import { formatRelativeDate } from "../lib/relative-date";
import { Tag } from "@/shared/ui/tag";
import { css } from "../../../../styled-system/css";

type FreshnessBadgeProps = {
  createdAt: string;
};

export function FreshnessBadge({ createdAt }: FreshnessBadgeProps) {
  return (
    <Tag className={css({ w: "fit-content" })} variant="gray">
      {formatRelativeDate(createdAt)}
    </Tag>
  );
}
