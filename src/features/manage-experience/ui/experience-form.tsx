"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

import {
  EXPERIENCE_BODY_MAX_LENGTH,
  EXPERIENCE_TITLE_MAX_LENGTH,
  type Experience,
  type NewExperienceInput
} from "@/entities/experience";
import { Button } from "@/shared/ui/button";

const inputClassName =
  "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

type ActionResult = { success: boolean; error?: string };

type ExperienceFormProps = {
  action: (input: NewExperienceInput) => Promise<ActionResult>;
  experience?: Experience;
  onSaved?: () => void;
};

export function ExperienceForm({
  action,
  experience,
  onSaved
}: ExperienceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      setMessage(null);
      const result = await action({
        title: String(formData.get("title") ?? ""),
        body: String(formData.get("body") ?? "")
      });

      if (!result.success) {
        setMessage({
          type: "error",
          text: result.error ?? "경험을 저장하지 못했습니다."
        });
        return;
      }

      if (!experience) {
        form.reset();
      }
      setMessage({ type: "success", text: "경험을 저장했습니다." });
      onSaved?.();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-sm font-medium">
        <span>제목</span>
        <input
          className={inputClassName}
          defaultValue={experience?.title}
          disabled={isPending}
          maxLength={EXPERIENCE_TITLE_MAX_LENGTH}
          name="title"
          placeholder="예: React 성능 최적화 프로젝트"
          required
        />
      </label>

      <label className="block space-y-2 text-sm font-medium">
        <span>내용</span>
        <textarea
          className={textareaClassName}
          defaultValue={experience?.body}
          disabled={isPending}
          maxLength={EXPERIENCE_BODY_MAX_LENGTH}
          name="body"
          placeholder="상황, 맡은 역할, 구체적 행동, 결과를 적어두세요."
          required
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
            <Save aria-hidden="true" className="size-4" />
          )}
          {experience ? "수정 저장" : "경험 저장"}
        </Button>
      </div>
    </form>
  );
}
