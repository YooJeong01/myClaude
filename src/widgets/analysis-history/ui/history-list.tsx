import Link from "next/link";

import type { CompanyAnalysisSummary } from "@/entities/company-analysis";

import { FreshnessBadge } from "./freshness-badge";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short"
});

type AnalysisHistoryListProps = {
  analyses: CompanyAnalysisSummary[];
  currentId?: string;
};

export function AnalysisHistoryList({
  analyses,
  currentId
}: AnalysisHistoryListProps) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-md border bg-card p-5 text-sm leading-6 text-muted-foreground">
        지난 분석 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="divide-y rounded-md border bg-card">
      {analyses.map((analysis) => (
        <article
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          key={analysis.id}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {analysis.role}
              {analysis.id === currentId ? " · 현재 보고서" : ""}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dateFormatter.format(new Date(analysis.createdAt))}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <FreshnessBadge createdAt={analysis.createdAt} />
            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={`/dashboard/analyses/${analysis.id}`}
            >
              결과 열기
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
