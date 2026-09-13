import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type RecipeVariantProps } from "../../../styled-system/css";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva({
  base: {
    alignItems: "center",
    borderRadius: "button",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: "14px",
    fontWeight: "500",
    gap: "2",
    justifyContent: "center",
    lineHeight: "1",
    minHeight: "touchTarget",
    outline: "none",
    transitionDuration: "fast",
    transitionProperty: "background, border-color, color, opacity",
    transitionTimingFunction: "standard",
    userSelect: "none",
    whiteSpace: "nowrap",
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.5,
      pointerEvents: "none"
    },
    _focusVisible: {
      outline: "2px solid",
      outlineColor: "link",
      outlineOffset: "2px"
    }
  },
  variants: {
    variant: {
      default: {
        bg: "primary",
        borderColor: "primary",
        borderWidth: "1px",
        color: "primaryText",
        _hover: { opacity: 0.88 }
      },
      secondary: {
        bg: "surface",
        borderColor: "surface",
        borderWidth: "1px",
        color: "text",
        _hover: { borderColor: "borderStrong" }
      },
      outline: {
        bg: "transparent",
        borderColor: "borderStrong",
        borderWidth: "1px",
        color: "text",
        _hover: { bg: "surface" }
      },
      ghost: {
        bg: "transparent",
        borderColor: "transparent",
        borderWidth: "1px",
        color: "text",
        _hover: { bg: "surface" }
      },
      link: {
        bg: "transparent",
        borderColor: "transparent",
        borderWidth: "1px",
        color: "link",
        minHeight: "auto",
        p: "0",
        textDecoration: "none",
        _hover: { textDecoration: "underline" }
      }
    },
    size: {
      sm: { h: "8", px: "3" },
      default: { h: "10", px: "4" },
      lg: { h: "11", px: "5" },
      icon: { h: "10", minWidth: "10", p: "0", w: "10" }
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default"
  }
});

type ButtonVariantProps = NonNullable<RecipeVariantProps<typeof buttonVariants>>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
