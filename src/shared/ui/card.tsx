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

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "aside";
};

const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ as, className, ...props }, ref) => {
    const Comp: React.ElementType = as ?? "div";

    return React.createElement(Comp, {
      className: cn(cardStyle, className),
      ref,
      ...props
    });
  }
);
Card.displayName = "Card";

export { Card, cardStyle };
