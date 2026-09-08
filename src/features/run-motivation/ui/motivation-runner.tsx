"use client";

import { useState } from "react";

import type { CompanyAnalysis } from "@/entities/company-analysis";
import type { Experience } from "@/entities/experience";
import { useOnline } from "@/shared/lib/use-online";

import { ExperiencePicker } from "./experience-picker";
import { RunMotivationButton } from "./run-motivation-button";

type MotivationRunnerProps = {
  analysis: CompanyAnalysis;
  experiences: Experience[];
};

export function MotivationRunner({
  analysis,
  experiences
}: MotivationRunnerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isOnline = useOnline();

  return (
    <div className="space-y-5">
      <ExperiencePicker
        experiences={experiences}
        onChange={setSelectedIds}
        selectedIds={selectedIds}
      />
      <RunMotivationButton
        analysisId={analysis.id}
        disabled={experiences.length === 0 || !isOnline}
        disabledReason={
          !isOnline
            ? "오프라인에서는 새로 지원동기를 만들 수 없습니다."
            : undefined
        }
        experienceIds={selectedIds}
        role={analysis.role}
      />
    </div>
  );
}
