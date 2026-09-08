import { redirect } from "next/navigation";
import Link from "next/link";

import { listRecentAnalyses } from "@/entities/company-analysis";
import { listExperiences } from "@/entities/experience";
import { listJobPostings, type JobPosting } from "@/entities/job-posting";
import { getUser } from "@/entities/session";
import { signOut } from "@/features/auth";
import { AddJobPostingForm } from "@/features/add-job-posting";
import { submitJobPosting } from "@/features/add-job-posting/lib/submit.server";
import { RunAnalysisButton } from "@/features/run-analysis";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium"
});

export async function DashboardView() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const [postings, experiences, analyses] = await Promise.all([
    listJobPostings(supabase),
    listExperiences(supabase),
    listRecentAnalyses(supabase)
  ]);
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
              <Button type="submit" variant="secondary">
                로그아웃
              </Button>
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
                  {postings.length}
                </p>
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-normal">공고 목록</h2>
          </div>
          {postings.length > 0 ? (
            <div className="divide-y rounded-md border bg-card">
              {postings.map((posting) => (
                <JobPostingListItem
                  key={posting.id}
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
        </section>
      </div>
    </main>
  );
}

function JobPostingListItem({
  latestAnalysis,
  posting
}: {
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
      <RunAnalysisButton className="mt-4" posting={posting} />
    </article>
  );
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}
