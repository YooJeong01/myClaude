"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

import type { Experience, NewExperienceInput } from "@/entities/experience";
import { Button } from "@/shared/ui/button";

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
      <div className="rounded-md border bg-card p-6 text-sm leading-6 text-muted-foreground">
        아직 저장된 경험이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p aria-live="polite" className="min-h-5 text-sm text-destructive">
        {error}
      </p>
      <div className="divide-y rounded-md border bg-card">
        {experiences.map((experience) => {
          const isEditing = editingId === experience.id;
          return (
            <article className="p-4" key={experience.id}>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
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
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-normal">
                        {experience.title}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {experience.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
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
      </div>
    </div>
  );
}
