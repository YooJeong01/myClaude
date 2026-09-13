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
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { css } from "../../../../styled-system/css";

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
    <form className={css({ display: "grid", gap: 4 })} onSubmit={handleSubmit}>
      <label
        className={css({
          display: "grid",
          gap: 2,
          fontWeight: 500,
          textStyle: "sm"
        })}
      >
        <span>제목</span>
        <Input
          defaultValue={experience?.title}
          disabled={isPending}
          maxLength={EXPERIENCE_TITLE_MAX_LENGTH}
          name="title"
          placeholder="예: React 성능 최적화 프로젝트"
          required
        />
      </label>

      <label
        className={css({
          display: "grid",
          gap: 2,
          fontWeight: 500,
          textStyle: "sm"
        })}
      >
        <span>내용</span>
        <Textarea
          className={css({ minH: "160px" })}
          defaultValue={experience?.body}
          disabled={isPending}
          maxLength={EXPERIENCE_BODY_MAX_LENGTH}
          name="body"
          placeholder="상황, 맡은 역할, 구체적 행동, 결과를 적어두세요."
          required
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
                color: message.type === "error" ? "tagRed.text" : "textMuted"
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
            <Save aria-hidden="true" className="size-4" />
          )}
          {experience ? "수정 저장" : "경험 저장"}
        </Button>
      </div>
    </form>
  );
}
