import type { ReactNode } from "react";

import { css } from "../../../styled-system/css";

type FormStatusMessage = {
  type: "error" | "success";
  text: string;
} | null;

type FormStatusRowProps = {
  children: ReactNode;
  message: FormStatusMessage;
};

export function FormStatusRow({ children, message }: FormStatusRowProps) {
  return (
    <div
      className={css({
        alignItems: { md: "center" },
        display: "flex",
        flexDirection: { base: "column", md: "row" },
        gap: 3,
        justifyContent: { md: "space-between" }
      })}
    >
      <p
        aria-live="polite"
        className={css({
          color: "textMuted",
          minH: 5,
          textStyle: "sm"
        })}
      >
        {message ? (
          <span
            className={css({
              color: message.type === "error" ? "dangerText" : "textMuted"
            })}
          >
            {message.text}
          </span>
        ) : null}
      </p>
      {children}
    </div>
  );
}
