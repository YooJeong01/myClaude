"use client";

import { useEffect, useState } from "react";

import type { MotivationDraft } from "@/entities/motivation-draft";
import {
  getDraft,
  putDraft,
  type MirroredDraft
} from "@/shared/lib/offline-mirror";
import { useOnline } from "@/shared/lib/use-online";
import { Card } from "@/shared/ui/card";
import { css } from "../../../../styled-system/css";

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
      <Card className={css({ color: "textMuted", p: 5, textStyle: "sm" })}>
        저장된 오프라인 지원동기 데이터를 찾지 못했습니다.
      </Card>
    );
  }

  return (
    <div className={css({ display: "grid", gap: 4 })}>
      {usingMirror ? (
        <Card className={css({ bg: "surface", fontWeight: 500, p: 4, textStyle: "sm" })}>
          오프라인 · 마지막으로 본 데이터
        </Card>
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
