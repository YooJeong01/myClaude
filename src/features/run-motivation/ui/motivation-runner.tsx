"use client";

import { useState } from "react";

import type { CompanyAnalysis } from "@/entities/company-analysis";
import type { Experience } from "@/entities/experience";

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

  return (
    <div className="space-y-5">
      <ExperiencePicker
        experiences={experiences}
        onChange={setSelectedIds}
        selectedIds={selectedIds}
      />
      <RunMotivationButton
        analysisId={analysis.id}
        disabled={experiences.length === 0}
        experienceIds={selectedIds}
        role={analysis.role}
      />
    </div>
  );
}
