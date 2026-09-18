import Link from "next/link";

import type { CompanyAnalysisSummary } from "@/entities/company-analysis";
import { Card } from "@/shared/ui/card";
import { separatedArticleListStyle } from "@/shared/ui/separated-list";
import { css } from "../../../../styled-system/css";

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
      <Card className={css({ color: "textMuted", p: 5, textStyle: "sm" })}>
        지난 분석 이력이 없습니다.
      </Card>
    );
  }

  return (
    <Card className={separatedArticleListStyle}>
      {analyses.map((analysis) => (
        <article
          className={css({
            alignItems: { md: "center" },
            display: "flex",
            flexDirection: { base: "column", md: "row" },
            gap: 3,
            justifyContent: "space-between",
            p: 4
          })}
          key={analysis.id}
        >
          <div className={css({ minW: 0 })}>
            <p className={css({ color: "text", fontWeight: 500, textStyle: "sm" })}>
              {analysis.role}
              {analysis.id === currentId ? " · 현재 보고서" : ""}
            </p>
            <p className={css({ color: "textMuted", mt: 1, textStyle: "sm" })}>
              {dateFormatter.format(new Date(analysis.createdAt))}
            </p>
          </div>
          <div
            className={css({
              alignItems: "center",
              display: "flex",
              flexShrink: 0,
              gap: 3
            })}
          >
            <FreshnessBadge createdAt={analysis.createdAt} />
            <Link
              className={css({
                color: "link",
                fontWeight: 500,
                textDecoration: "none",
                textStyle: "sm",
                textUnderlineOffset: "4px",
                _hover: { textDecoration: "underline" }
              })}
              href={`/dashboard/analyses/${analysis.id}`}
            >
              결과 열기
            </Link>
          </div>
        </article>
      ))}
    </Card>
  );
}
