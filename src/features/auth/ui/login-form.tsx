"use client";

import { Loader2, Mail } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/shared/ui/button";

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

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
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-sm font-medium">
        <span>이메일</span>
        <input
          autoComplete="email"
          className={inputClassName}
          disabled={isPending}
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="min-h-5 text-sm text-muted-foreground"
        >
          {message ? (
            <span
              className={
                message.type === "error" ? "text-destructive" : undefined
              }
            >
              {message.text}
            </span>
          ) : null}
        </p>
        <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
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
