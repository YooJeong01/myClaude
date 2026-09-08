"use client";

import { useEffect, useState } from "react";

import type { MotivationDraft } from "@/entities/motivation-draft";
import {
  getDraft,
  putDraft,
  type MirroredDraft
} from "@/shared/lib/offline-mirror";
import { useOnline } from "@/shared/lib/use-online";

import { MotivationResultView } from "./result";

type MirroredMotivationResultProps = {
  draft: MotivationDraft | null;
  draftId: string;
};

export function MirroredMotivationResult({
  draft,
  draftId
}: MirroredMotivationResultProps) {
  const isOnline = useOnline();
  const [mirroredDraft, setMirroredDraft] = useState<MotivationDraft | null>(
    draft
  );
  const usingMirror = !draft || !isOnline;
  const visibleDraft = usingMirror ? mirroredDraft : draft;

  useEffect(() => {
    if (!draft) {
      return;
    }

    setMirroredDraft(draft);
    void putDraft(toMirroredDraft(draft));
  }, [draft]);

  useEffect(() => {
    if (draft && isOnline) {
      return;
    }

    void getDraft(draftId).then((row) => {
      if (row) {
        setMirroredDraft(fromMirroredDraft(row));
      }
    });
  }, [draft, draftId, isOnline]);

  if (!visibleDraft) {
    return (
      <div className="rounded-md border bg-card p-5 text-sm leading-6 text-muted-foreground">
        저장된 오프라인 지원동기 데이터를 찾지 못했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {usingMirror ? (
        <div className="rounded-md border bg-secondary p-4 text-sm font-medium text-secondary-foreground">
          오프라인 · 마지막으로 본 데이터
        </div>
      ) : null}
      <MotivationResultView draft={visibleDraft} />
    </div>
  );
}

function toMirroredDraft(draft: MotivationDraft): MirroredDraft {
  return {
    id: draft.id,
    companyAnalysisId: draft.companyAnalysisId,
    jobPostingId: draft.jobPostingId,
    experienceIds: draft.experienceIds,
    result: draft.result,
    model: draft.model,
    createdAt: draft.createdAt
  };
}

function fromMirroredDraft(row: MirroredDraft): MotivationDraft {
  return row as MotivationDraft;
}
