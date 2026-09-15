import * as React from "react";
import { css } from "../../../styled-system/css";
import { cn } from "@/shared/lib/utils";

const cardStyle = css({
  borderColor: "border",
  borderRadius: "card",
  borderWidth: "1px",
  color: "text"
});

const cardBgStyles = {
  elevated: css({ bg: "bgElevated" }),
  surface: css({ bg: "surface" })
};

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "aside";
  variant?: keyof typeof cardBgStyles;
};

const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ as, className, variant = "elevated", ...props }, ref) => {
    const Comp: React.ElementType = as ?? "div";

    return React.createElement(Comp, {
      className: cn(cardStyle, cardBgStyles[variant], className),
      ref,
      ...props
    });
  }
);
Card.displayName = "Card";

const elevatedCardStyle = cn(cardStyle, cardBgStyles.elevated);

export { Card, elevatedCardStyle as cardStyle };
