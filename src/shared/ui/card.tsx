import * as React from "react";
import { css } from "../../../styled-system/css";
import { cn } from "@/shared/lib/utils";

const cardStyle = css({
  bg: "bgElevated",
  borderColor: "border",
  borderRadius: "card",
  borderWidth: "1px",
  color: "text"
});

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div className={cn(cardStyle, className)} ref={ref} {...props} />
  )
);
Card.displayName = "Card";

export { Card, cardStyle };
