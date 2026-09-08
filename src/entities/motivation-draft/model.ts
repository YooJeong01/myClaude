import type { MotivationResult } from "@server/motivation/types";

export type MotivationDraft = {
  id: string;
  companyAnalysisId: string;
  jobPostingId: string | null;
  experienceIds: string[];
  result: MotivationResult;
  model: string | null;
  createdAt: string;
};

export type MotivationDraftSummary = Pick<
  MotivationDraft,
  "id" | "companyAnalysisId" | "experienceIds" | "createdAt"
>;
