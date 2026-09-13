import { redirect } from "next/navigation";
import Link from "next/link";

import { listRecentAnalyses } from "@/entities/company-analysis";
import { listExperiences } from "@/entities/experience";
import {
  EMPLOYMENT_TYPES,
  CAREER_LEVELS,
  getDdayBadge,
  listJobPostings,
  type CareerLevel,
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
    careerLevel?: string;
    source?: string;
    showClosed?: string;
    onlyClosed?: string;
    page?: string;
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
      careerLevel: filters.careerLevel || undefined,
      source: filters.source || undefined,
      showClosed: filters.showClosed,
      onlyClosed: filters.onlyClosed,
      page: filters.page,
      limit: 10
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
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/dashboard/analyses">기업분석 목록</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard/calendar">채용 캘린더</Link>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="secondary">
                  로그아웃
                </Button>
              </form>
            </div>
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
          <Pagination
            currentPage={postingResult.page}
            filters={filters}
            totalPages={postingResult.totalPages}
          />
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
  const dday = getDdayBadge(posting.deadline);

  return (
    <article className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {posting.companyNameRaw ?? "회사명 미입력"}
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className={getDdayBadgeClassName(dday.kind)}>
              {dday.label}
            </span>
            <h3 className="truncate text-base font-semibold tracking-normal">
              {posting.role}
            </h3>
          </div>
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
  careerLevel: CareerLevel | "";
  source: string;
  showClosed: boolean;
  onlyClosed: boolean;
  page: number;
};

function normalizeFilters(
  searchParams: DashboardViewProps["searchParams"]
): NormalizedDashboardFilters {
  const employmentType = EMPLOYMENT_TYPES.includes(
    searchParams?.employmentType as EmploymentType
  )
    ? (searchParams?.employmentType as EmploymentType)
    : "";
  const careerLevel = CAREER_LEVELS.includes(
    searchParams?.careerLevel as CareerLevel
  )
    ? (searchParams?.careerLevel as CareerLevel)
    : "";
  const page = Number.parseInt(searchParams?.page ?? "1", 10);

  return {
    q: searchParams?.q?.trim() ?? "",
    employmentType,
    careerLevel,
    source: searchParams?.source?.trim() ?? "",
    showClosed: searchParams?.showClosed === "1",
    onlyClosed: searchParams?.onlyClosed === "1",
    page: Number.isFinite(page) && page > 0 ? page : 1
  };
}

function Pagination({
  currentPage,
  filters,
  totalPages
}: {
  currentPage: number;
  filters: NormalizedDashboardFilters;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="공고 목록 페이지"
      className="mt-5 flex flex-wrap items-center justify-center gap-2"
    >
      <Button asChild disabled={currentPage <= 1} variant="secondary">
        <Link
          aria-disabled={currentPage <= 1}
          href={{
            pathname: "/dashboard",
            query: buildPageQuery(filters, Math.max(1, currentPage - 1))
          }}
        >
          이전
        </Link>
      </Button>
      {pages.map((page) => (
        <Button
          asChild
          key={page}
          variant={page === currentPage ? "default" : "secondary"}
        >
          <Link
            aria-current={page === currentPage ? "page" : undefined}
            href={{
              pathname: "/dashboard",
              query: buildPageQuery(filters, page)
            }}
          >
            {page}
          </Link>
        </Button>
      ))}
      <Button asChild disabled={currentPage >= totalPages} variant="secondary">
        <Link
          aria-disabled={currentPage >= totalPages}
          href={{
            pathname: "/dashboard",
            query: buildPageQuery(filters, Math.min(totalPages, currentPage + 1))
          }}
        >
          다음
        </Link>
      </Button>
    </nav>
  );
}

function buildPageQuery(
  filters: ReturnType<typeof normalizeFilters>,
  page: number
) {
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.employmentType ? { employmentType: filters.employmentType } : {}),
    ...(filters.careerLevel ? { careerLevel: filters.careerLevel } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.showClosed ? { showClosed: "1" } : {}),
    ...(filters.onlyClosed ? { onlyClosed: "1" } : {}),
    ...(page > 1 ? { page: String(page) } : {})
  };
}

function getPageWindow(current: number, total: number, size = 5): number[] {
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getDdayBadgeClassName(kind: ReturnType<typeof getDdayBadge>["kind"]) {
  const base = "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium";
  if (kind === "closed") return `${base} bg-red-100 text-red-700`;
  if (kind === "hours") return `${base} bg-yellow-100 text-yellow-800`;
  if (kind === "dday") return `${base} bg-blue-100 text-blue-700`;
  return `${base} bg-secondary text-secondary-foreground`;
}
