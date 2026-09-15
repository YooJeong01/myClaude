import * as React from "react";
import { css } from "../../../styled-system/css";
import { cn } from "@/shared/lib/utils";

const textareaStyle = css({
  bg: "bg",
  borderColor: "border",
  borderRadius: "input",
  borderWidth: "1px",
  color: "text",
  px: 3,
  py: 2,
  resize: "vertical",
  textStyle: "sm",
  transitionDuration: "fast",
  transitionProperty: "colors",
  transitionTimingFunction: "standard",
  w: "full",
  _disabled: {
    cursor: "not-allowed",
    opacity: 0.6
  },
  _focus: {
    borderColor: "link",
    outline: "2px solid",
    outlineColor: "link",
    outlineOffset: "1px"
  },
  _placeholder: {
    color: "textFaint"
  }
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea className={cn(textareaStyle, className)} ref={ref} {...props} />
  )
);
Textarea.displayName = "Textarea";

export { Textarea, textareaStyle };
