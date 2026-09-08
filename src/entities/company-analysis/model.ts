import type {
  AnalysisSources,
  CompanyAnalysisResult
} from "@server/analysis/types";

export type CompanyAnalysis = {
  id: string;
  companyId: string;
  companyName: string;
  role: string;
  jobPostingId: string | null;
  result: CompanyAnalysisResult;
  sources: AnalysisSources;
  model: string | null;
  createdAt: string;
};

export type CompanyAnalysisSummary = Pick<
  CompanyAnalysis,
  "id" | "companyId" | "companyName" | "role" | "jobPostingId" | "createdAt"
>;
