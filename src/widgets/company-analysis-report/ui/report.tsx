import Link from "next/link";

import type { CompanyAnalysis } from "@/entities/company-analysis";
import { Button } from "@/shared/ui/button";

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
    <article className="space-y-6">
      <header className="border-b pb-5">
        <p className="text-sm font-medium text-muted-foreground">
          {dateFormatter.format(new Date(analysis.createdAt))}
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {analysis.companyName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {analysis.role}
            </p>
            {result.estimated_size ? (
              <SizeBadge
                basis={result.estimated_size.basis}
                label={result.estimated_size.label}
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
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
        <p className="mb-3 text-sm font-medium text-primary">
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
    <div className="mt-3 inline-flex max-w-full flex-col rounded-md border bg-secondary px-3 py-2 text-secondary-foreground">
      <span className="text-xs font-semibold">{label} 추정</span>
      <span className="mt-1 text-xs leading-5 text-muted-foreground">
        {basis}
      </span>
    </div>
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
    <section className="rounded-md border bg-card p-5 text-card-foreground">
      <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p>표시할 항목이 없습니다.</p>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
