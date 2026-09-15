import * as React from "react";
import { cva, type RecipeVariantProps } from "../../../styled-system/css";
import { cn } from "@/shared/lib/utils";

const tagVariants = cva({
  base: {
    alignItems: "center",
    borderRadius: "pill",
    display: "inline-flex",
    fontSize: "12px",
    fontWeight: "500",
    h: "6",
    lineHeight: "1",
    px: "2",
    whiteSpace: "nowrap"
  },
  variants: {
    variant: {
      gray: { bg: "tagGray.bg", color: "tagGray.text" },
      blue: { bg: "tagBlue.bg", color: "tagBlue.text" },
      green: { bg: "tagGreen.bg", color: "tagGreen.text" },
      yellow: { bg: "tagYellow.bg", color: "tagYellow.text" },
      red: { bg: "tagRed.bg", color: "tagRed.text" }
    },
    size: {
      sm: { h: "6", px: "2" }
    }
  },
  defaultVariants: {
    variant: "gray",
    size: "sm"
  }
});

type TagVariantProps = NonNullable<RecipeVariantProps<typeof tagVariants>>;

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    TagVariantProps {}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      className={cn(tagVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Tag.displayName = "Tag";

export { Tag, tagVariants };
