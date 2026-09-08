import { redirect } from "next/navigation";
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
import { getUser } from "@/entities/session";
import { signOut } from "@/features/auth";
import { AddJobPostingForm } from "@/features/add-job-posting";
import { submitJobPosting } from "@/features/add-job-posting/lib/submit.server";
import { RunAnalysisButton } from "@/features/run-analysis";
import { JobPostingFilterForm } from "@/features/search-job-postings";
import { SaveToggle } from "@/features/toggle-saved-posting";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";

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
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

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
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {user.email ?? "로그인 사용자"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                공고 대시보드
              </h1>
            </div>
            <form action={signOut}>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <Link href="/dashboard/analyses">기업분석 목록</Link>
                </Button>
                <Button type="submit" variant="secondary">
                  로그아웃
                </Button>
              </div>
            </form>
          </div>
        </header>

        <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-md border bg-card p-5 text-card-foreground">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-normal">
                수동 공고 입력
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                URL이나 본문 중 하나를 넣으면 저장할 수 있습니다.
              </p>
            </div>
            <AddJobPostingForm submitAction={submitJobPosting} />
          </div>

          <aside className="rounded-md border bg-card p-5 text-card-foreground">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  저장된 공고
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-normal">
                  {postingResult.total}
                </p>
              </div>
              <div className="border-t pt-5">
                <p className="text-sm font-medium text-muted-foreground">
                  북마크한 공고
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-normal">
                  {savedPostingIds.size}
                </p>
                <Button asChild className="mt-4 w-full" variant="secondary">
                  <Link href="/dashboard/calendar">캘린더</Link>
                </Button>
              </div>
              <div className="border-t pt-5">
                <p className="text-sm font-medium text-muted-foreground">
                  내 경험
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-normal">
                  {experiences.length}
                </p>
                <Button asChild className="mt-4 w-full" variant="secondary">
                  <Link href="/dashboard/experiences">경험 관리</Link>
                </Button>
              </div>
            </div>
          </aside>
        </section>

        <section className="pb-8">
          <div className="mb-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-normal">공고 목록</h2>
              <p className="text-sm text-muted-foreground">
                전체 {postingResult.total}건 중 {postings.length}건
              </p>
            </div>
            <JobPostingFilterForm defaultValues={filters} />
          </div>
          {postings.length > 0 ? (
            <div className="divide-y rounded-md border bg-card">
              {postings.map((posting) => (
                <JobPostingListItem
                  key={posting.id}
                  initialSaved={savedPostingIds.has(posting.id)}
                  latestAnalysis={latestAnalysisByPostingId.get(posting.id)}
                  posting={posting}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-card p-6 text-sm leading-6 text-muted-foreground">
              아직 저장된 공고가 없습니다.
            </div>
          )}
          {postingResult.nextCursor ? (
            <div className="mt-5 flex justify-center">
              <Button asChild variant="secondary">
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
    </main>
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
    <article className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {posting.companyNameRaw ?? "회사명 미입력"}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-normal">
            {posting.role}
          </h3>
        </div>
        <span className="w-fit rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {posting.employmentType}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span>등록 {formatDate(posting.createdAt)}</span>
        <span>마감 {posting.deadline ? formatDate(posting.deadline) : "미정"}</span>
        {posting.url ? (
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={posting.url}
            rel="noreferrer"
            target="_blank"
          >
            원문 보기
          </a>
        ) : null}
        {latestAnalysis ? (
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href={`/dashboard/analyses/${latestAnalysis.id}`}
          >
            최근 분석 {formatDate(latestAnalysis.createdAt)}
          </Link>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
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
