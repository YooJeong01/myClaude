"use client";

import { Loader2, Mail } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { css } from "../../../../styled-system/css";

type LoginFormProps = {
  requestAction: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  errorMessage?: string;
};

export function LoginForm({ requestAction, errorMessage }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(
    errorMessage ? { type: "error", text: errorMessage } : null
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    startTransition(async () => {
      setMessage(null);
      const result = await requestAction(email);

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error ?? "로그인 링크를 발송하지 못했습니다."
        });
        return;
      }

      setMessage({
        type: "success",
        text: "메일함에서 로그인 링크를 확인하세요."
      });
    });
  }

  return (
    <form className={css({ display: "grid", gap: 5 })} onSubmit={handleSubmit}>
      <label
        className={css({
          display: "grid",
          gap: 2,
          fontWeight: 500,
          textStyle: "sm"
        })}
      >
        <span>이메일</span>
        <Input
          autoComplete="email"
          disabled={isPending}
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
      </label>

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
        <Button
          className={css({ w: { base: "full", md: "auto" } })}
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Mail aria-hidden="true" className="size-4" />
          )}
          로그인 링크 받기
        </Button>
      </div>
    </form>
  );
}
