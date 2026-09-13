import Link from "next/link";

import type { CompanyAnalysis } from "@/entities/company-analysis";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { css } from "../../../../styled-system/css";

import { AnalysisSourcesView } from "./sources";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short"
});

type CompanyAnalysisReportProps = {
  analysis: CompanyAnalysis;
  action?: React.ReactNode;
};

export function CompanyAnalysisReport({
  action,
  analysis
}: CompanyAnalysisReportProps) {
  const result = analysis.result;

  return (
    <article className={css({ display: "grid", gap: 6 })}>
      <header className={css({ borderBottomWidth: "1px", borderColor: "border", pb: 5 })}>
        <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
          {dateFormatter.format(new Date(analysis.createdAt))}
        </p>
        <div
          className={css({
            alignItems: { md: "flex-start" },
            display: "flex",
            flexDirection: { base: "column", md: "row" },
            gap: 4,
            justifyContent: "space-between",
            mt: 2
          })}
        >
          <div>
            <h1 className={css({ textStyle: "3xl" })}>
              {analysis.companyName}
            </h1>
            <p className={css({ color: "textMuted", mt: 2, textStyle: "sm" })}>
              {analysis.role}
            </p>
            {result.estimated_size ? (
              <SizeBadge
                basis={result.estimated_size.basis}
                label={result.estimated_size.label}
              />
            ) : null}
          </div>
          <div
            className={css({
              alignItems: { md: "flex-end" },
              display: "flex",
              flexDirection: "column",
              gap: 2
            })}
          >
            {action}
            <Button asChild>
              <Link href={`/dashboard/analyses/${analysis.id}/motivation`}>
                이 분석으로 지원동기 만들기
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ReportSection title="회사 개요">
        <p>{result.overview}</p>
      </ReportSection>
      <ReportSection title="재무 요약">
        <p>{result.financials_summary}</p>
      </ReportSection>
      <ReportSection title="최근 뉴스 테마">
        <BulletList items={result.recent_news_themes} />
      </ReportSection>
      <ReportSection title="애널리스트 시각">
        <p>{result.analyst_view}</p>
      </ReportSection>
      <ReportSection title="리스크">
        <BulletList items={result.risks} />
      </ReportSection>
      <ReportSection title="지원동기 매칭 소재">
        <p className={css({ color: "link", fontWeight: 500, mb: 3, textStyle: "sm" })}>
          지원동기 매칭에 쓰이는 항목입니다.
        </p>
        <BulletList items={result.talking_points} />
      </ReportSection>

      <AnalysisSourcesView sources={analysis.sources} />
    </article>
  );
}

function SizeBadge({ basis, label }: { basis: string; label: string }) {
  return (
    <Tag
      className={css({
        alignItems: "flex-start",
        flexDirection: "column",
        h: "auto",
        maxW: "full",
        mt: 3,
        py: 2,
        whiteSpace: "normal"
      })}
      variant="yellow"
    >
      <span className={css({ fontSize: "12px", fontWeight: 700 })}>{label} 추정</span>
      <span className={css({ mt: 1, textStyle: "xs" })}>{basis}</span>
    </Tag>
  );
}

function ReportSection({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card className={css({ p: 5 })}>
      <h2 className={css({ textStyle: "lg" })}>{title}</h2>
      <div className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
        {children}
      </div>
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p>표시할 항목이 없습니다.</p>;
  }

  return (
    <ul className={css({ display: "grid", gap: 2, listStyleType: "disc", pl: 5 })}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
