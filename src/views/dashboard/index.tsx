import Link from "next/link";

import { listRecentAnalyses } from "@/entities/company-analysis";
import { listExperiences } from "@/entities/experience";
import {
  EMPLOYMENT_TYPES,
  listJobPostings,
  type EmploymentType,
  type JobPosting
} from "@/entities/job-posting";
import { listSavedPostingIds } from "@/entities/saved-posting";
import { AddJobPostingForm } from "@/features/add-job-posting";
import { submitJobPosting } from "@/features/add-job-posting/lib/submit.server";
import { RunAnalysisButton } from "@/features/run-analysis";
import { JobPostingFilterForm } from "@/features/search-job-postings";
import { SaveToggle } from "@/features/toggle-saved-posting";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { css } from "../../../styled-system/css";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium"
});

type DashboardViewProps = {
  searchParams?: {
    q?: string;
    employmentType?: string;
    source?: string;
    onlyOpen?: string;
    cursor?: string;
  };
};

export async function DashboardView({ searchParams }: DashboardViewProps) {
  const filters = normalizeFilters(searchParams);
  const supabase = await createSupabaseServerClient();
  const [postingResult, experiences, analyses, savedPostingIds] = await Promise.all([
    listJobPostings(supabase, {
      q: filters.q,
      employmentType: filters.employmentType || undefined,
      source: filters.source || undefined,
      onlyOpen: filters.onlyOpen,
      cursor: filters.cursor,
      limit: 20
    }),
    listExperiences(supabase),
    listRecentAnalyses(supabase),
    listSavedPostingIds(supabase)
  ]);
  const postings = postingResult.rows;
  const latestAnalysisByPostingId = new Map(
    analyses
      .filter((analysis) => analysis.jobPostingId)
      .map((analysis) => [analysis.jobPostingId, analysis])
  );

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: 6 })}>
        <header
          className={css({
            borderBottomWidth: "1px",
            borderColor: "border",
            pb: 5
          })}
        >
          <div
            className={css({
              alignItems: { md: "flex-start" },
              display: "flex",
              flexDirection: { base: "column", md: "row" },
              gap: 4,
              justifyContent: "space-between"
            })}
          >
            <div>
              <h1 className={css({ textStyle: "3xl" })}>
                공고 대시보드
              </h1>
            </div>
            <div className={css({ display: "flex", flexWrap: "wrap", gap: 2 })}>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/analyses">기업분석 목록</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/calendar">채용 캘린더</Link>
              </Button>
            </div>
          </div>
        </header>

        <section
          className={css({
            display: "grid",
            gap: 6,
            gridTemplateColumns: { base: "1fr", md: "minmax(0, 1fr) 22rem" }
          })}
        >
          <Card className={css({ p: 5 })}>
            <div className={css({ mb: 5 })}>
              <h2 className={css({ textStyle: "lg" })}>
                수동 공고 입력
              </h2>
              <p className={css({ color: "textMuted", mt: 1, textStyle: "sm" })}>
                URL이나 본문 중 하나를 넣으면 저장할 수 있습니다.
              </p>
            </div>
            <AddJobPostingForm submitAction={submitJobPosting} />
          </Card>

          <Card className={css({ p: 5 })}>
            <div className={css({ display: "grid", gap: 5 })}>
              <div>
                <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
                  저장된 공고
                </p>
                <p className={css({ mt: 2, textStyle: "3xl" })}>
                  {postingResult.total}
                </p>
              </div>
              <div className={css({ borderColor: "border", borderTopWidth: "1px", pt: 5 })}>
                <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
                  북마크한 공고
                </p>
                <p className={css({ mt: 2, textStyle: "3xl" })}>
                  {savedPostingIds.size}
                </p>
                <Button asChild className={css({ mt: 4, w: "full" })} variant="secondary">
                  <Link href="/dashboard/calendar">캘린더</Link>
                </Button>
              </div>
              <div className={css({ borderColor: "border", borderTopWidth: "1px", pt: 5 })}>
                <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
                  내 경험
                </p>
                <p className={css({ mt: 2, textStyle: "3xl" })}>
                  {experiences.length}
                </p>
                <Button asChild className={css({ mt: 4, w: "full" })} variant="secondary">
                  <Link href="/dashboard/experiences">경험 관리</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <section className={css({ pb: 8 })}>
          <div className={css({ display: "grid", gap: 4, mb: 4 })}>
            <div
              className={css({
                alignItems: "center",
                display: "flex",
                gap: 3,
                justifyContent: "space-between"
              })}
            >
              <h2 className={css({ textStyle: "lg" })}>공고 목록</h2>
              <p className={css({ color: "textMuted", textStyle: "sm" })}>
                전체 {postingResult.total}건 중 {postings.length}건
              </p>
            </div>
            <JobPostingFilterForm defaultValues={filters} />
          </div>
          {postings.length > 0 ? (
            <Card
              className={css({
                "& > article + article": {
                  borderColor: "border",
                  borderTopWidth: "1px"
                }
              })}
            >
              {postings.map((posting) => (
                <JobPostingListItem
                  key={posting.id}
                  initialSaved={savedPostingIds.has(posting.id)}
                  latestAnalysis={latestAnalysisByPostingId.get(posting.id)}
                  posting={posting}
                />
              ))}
            </Card>
          ) : (
            <Card className={css({ color: "textMuted", p: 6, textStyle: "sm" })}>
              아직 저장된 공고가 없습니다.
            </Card>
          )}
          {postingResult.nextCursor ? (
            <div className={css({ display: "flex", justifyContent: "center", mt: 5 })}>
              <Button asChild variant="outline">
                <Link
                  href={{
                    pathname: "/dashboard",
                    query: buildNextQuery(filters, postingResult.nextCursor)
                  }}
                >
                  더 보기
                </Link>
              </Button>
            </div>
          ) : null}
        </section>
    </div>
  );
}

function JobPostingListItem({
  initialSaved,
  latestAnalysis,
  posting
}: {
  initialSaved: boolean;
  latestAnalysis?: { id: string; createdAt: string };
  posting: JobPosting;
}) {
  return (
    <article className={css({ p: 4 })}>
      <div
        className={css({
          display: "flex",
          flexDirection: { base: "column", md: "row" },
          gap: 3,
          justifyContent: "space-between",
          alignItems: { md: "flex-start" }
        })}
      >
        <div className={css({ minW: 0 })}>
          <p className={css({ color: "textMuted", textStyle: "sm" })}>
            {posting.companyNameRaw ?? "회사명 미입력"}
          </p>
          <h3
            className={css({
              mt: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              textStyle: "lg",
              whiteSpace: "nowrap"
            })}
          >
            {posting.role}
          </h3>
        </div>
        <Tag className={css({ w: "fit-content" })} size="sm" variant="gray">
          {posting.employmentType}
        </Tag>
      </div>
      <div
        className={css({
          color: "textMuted",
          columnGap: 4,
          display: "flex",
          flexWrap: "wrap",
          mt: 3,
          rowGap: 2,
          textStyle: "sm"
        })}
      >
        <span>등록 {formatDate(posting.createdAt)}</span>
        <span>마감 {posting.deadline ? formatDate(posting.deadline) : "미정"}</span>
        {posting.url ? (
          <a
            className={css({
              color: "link",
              textDecoration: "none",
              textUnderlineOffset: "4px",
              _hover: { textDecoration: "underline" }
            })}
            href={posting.url}
            rel="noreferrer"
            target="_blank"
          >
            원문 보기
          </a>
        ) : null}
        {latestAnalysis ? (
          <Link
            className={css({
              color: "link",
              textDecoration: "none",
              textUnderlineOffset: "4px",
              _hover: { textDecoration: "underline" }
            })}
            href={`/dashboard/analyses/${latestAnalysis.id}`}
          >
            최근 분석 {formatDate(latestAnalysis.createdAt)}
          </Link>
        ) : null}
      </div>
      <div className={css({ display: "flex", flexWrap: "wrap", gap: 2, mt: 4 })}>
        <RunAnalysisButton posting={posting} />
        <SaveToggle initialSaved={initialSaved} jobPostingId={posting.id} />
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

type NormalizedDashboardFilters = {
  q: string;
  employmentType: EmploymentType | "";
  source: string;
  onlyOpen: boolean;
  cursor?: string;
};

function normalizeFilters(
  searchParams: DashboardViewProps["searchParams"]
): NormalizedDashboardFilters {
  const employmentType = EMPLOYMENT_TYPES.includes(
    searchParams?.employmentType as EmploymentType
  )
    ? (searchParams?.employmentType as EmploymentType)
    : "";

  return {
    q: searchParams?.q?.trim() ?? "",
    employmentType,
    source: searchParams?.source?.trim() ?? "",
    onlyOpen: searchParams?.onlyOpen === "1",
    cursor: searchParams?.cursor
  };
}

function buildNextQuery(
  filters: ReturnType<typeof normalizeFilters>,
  cursor: string
) {
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.employmentType ? { employmentType: filters.employmentType } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.onlyOpen ? { onlyOpen: "1" } : {}),
    cursor
  };
}
