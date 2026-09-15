import * as React from "react";
import { css } from "../../../styled-system/css";
import { cn } from "@/shared/lib/utils";

const inputStyle = css({
  bg: "bg",
  borderColor: "border",
  borderRadius: "input",
  borderWidth: "1px",
  color: "text",
  h: 10,
  px: 3,
  textStyle: "sm",
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

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input className={cn(inputStyle, className)} ref={ref} {...props} />
  )
);
Input.displayName = "Input";

export { Input, inputStyle };
