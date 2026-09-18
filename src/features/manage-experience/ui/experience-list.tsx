"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

import type { Experience, NewExperienceInput } from "@/entities/experience";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { separatedArticleListStyle } from "@/shared/ui/separated-list";
import { css } from "../../../../styled-system/css";

import { ExperienceForm } from "./experience-form";

type ActionResult = { success: boolean; error?: string };

type ExperienceListProps = {
  experiences: Experience[];
  editAction: (
    id: string,
    input: NewExperienceInput
  ) => Promise<ActionResult>;
  removeAction: (id: string) => Promise<ActionResult>;
};

export function ExperienceList({
  experiences,
  editAction,
  removeAction
}: ExperienceListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(experience: Experience) {
    if (!window.confirm(`'${experience.title}' 경험을 삭제할까요?`)) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setPendingId(experience.id);
      const result = await removeAction(experience.id);
      setPendingId(null);
      if (!result.success) {
        setError(result.error ?? "경험을 삭제하지 못했습니다.");
      }
    });
  }

  if (experiences.length === 0) {
    return (
      <Card className={css({ color: "textMuted", p: 6, textStyle: "sm" })}>
        아직 저장된 경험이 없습니다.
      </Card>
    );
  }

  return (
    <div className={css({ display: "grid", gap: 4 })}>
      <p
        aria-live="polite"
        className={css({
          color: "dangerText",
          minH: 5,
          textStyle: "sm"
        })}
      >
        {error}
      </p>
      <Card className={separatedArticleListStyle}>
        {experiences.map((experience) => {
          const isEditing = editingId === experience.id;
          return (
            <article className={css({ p: 4 })} key={experience.id}>
              {isEditing ? (
                <div className={css({ display: "grid", gap: 4 })}>
                  <div className={css({ display: "flex", justifyContent: "flex-end" })}>
                    <Button
                      onClick={() => setEditingId(null)}
                      type="button"
                      variant="secondary"
                    >
                      <X aria-hidden="true" className="size-4" />
                      닫기
                    </Button>
                  </div>
                  <ExperienceForm
                    action={(input) => editAction(experience.id, input)}
                    experience={experience}
                    onSaved={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className={css({ display: "grid", gap: 3 })}>
                  <div
                    className={css({
                      alignItems: { md: "flex-start" },
                      display: "flex",
                      flexDirection: { base: "column", md: "row" },
                      gap: 3,
                      justifyContent: { md: "space-between" }
                    })}
                  >
                    <div className={css({ minW: 0 })}>
                      <h3 className={css({ textStyle: "lg" })}>
                        {experience.title}
                      </h3>
                      <p
                        className={css({
                          color: "textMuted",
                          mt: 2,
                          textStyle: "sm",
                          whiteSpace: "pre-wrap"
                        })}
                      >
                        {experience.body}
                      </p>
                    </div>
                    <div className={css({ display: "flex", flexShrink: 0, gap: 2 })}>
                      <Button
                        onClick={() => setEditingId(experience.id)}
                        type="button"
                        variant="secondary"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        수정
                      </Button>
                      <Button
                        disabled={isPending && pendingId === experience.id}
                        onClick={() => handleRemove(experience)}
                        type="button"
                        variant="secondary"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </Card>
    </div>
  );
}
