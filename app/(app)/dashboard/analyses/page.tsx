import Link from "next/link";
import { redirect } from "next/navigation";

import {
  listAnalysesGrouped,
  type CompanyAnalysisGroup
} from "@/entities/company-analysis";
import { getUser } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium"
});

type AnalysesPageProps = {
  searchParams?: Promise<{
    q?: string;
    cursor?: string;
  }>;
};

export default async function AnalysesPage({
  searchParams
}: AnalysesPageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const cursor = params?.cursor;
  const supabase = await createSupabaseServerClient();
  const { rows, nextCursor } = await listAnalysesGrouped(supabase, {
    q,
    cursor,
    limit: 12
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              기업분석 모아보기
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              회사별 분석
            </h1>
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard">대시보드</Link>
          </Button>
        </header>

        <form className="flex flex-col gap-3 sm:flex-row" action="/dashboard/analyses">
          <input
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            defaultValue={q}
            name="q"
            placeholder="회사명 검색"
          />
          <Button type="submit">검색</Button>
        </form>

        {rows.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((group) => (
              <CompanyAnalysisCard group={group} key={group.companyId} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-card p-6 text-sm leading-6 text-muted-foreground">
            표시할 기업분석이 없습니다.
          </div>
        )}

        {nextCursor ? (
          <div className="flex justify-center">
            <Button asChild variant="secondary">
              <Link
                href={{
                  pathname: "/dashboard/analyses",
                  query: { ...(q ? { q } : {}), cursor: nextCursor }
                }}
              >
                더 보기
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function CompanyAnalysisCard({ group }: { group: CompanyAnalysisGroup }) {
  return (
    <Link
      className="block rounded-md border bg-card p-5 text-card-foreground transition-colors hover:border-primary"
      href={`/dashboard/analyses/${group.latest.id}`}
    >
      <p className="text-sm text-muted-foreground">
        최신 분석 {dateFormatter.format(new Date(group.latest.createdAt))}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-normal">
        {group.companyName}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {group.latest.role}
      </p>
      {group.latest.result.estimated_size ? (
        <p className="mt-3 w-fit rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {group.latest.result.estimated_size.label} 추정
        </p>
      ) : null}
      <p className="mt-4 text-sm font-medium text-primary">
        {group.count}개 이력
      </p>
    </Link>
  );
}
