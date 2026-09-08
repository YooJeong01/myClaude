import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAnalysis } from "@/entities/company-analysis";
import { listExperiences } from "@/entities/experience";
import { getUser } from "@/entities/session";
import { MotivationRunner } from "@/features/run-motivation";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";

type MotivationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MotivationPage({ params }: MotivationPageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [analysis, experiences] = await Promise.all([
    getAnalysis(supabase, id),
    listExperiences(supabase)
  ]);
  if (!analysis) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b pb-5">
          <p className="text-sm font-medium text-muted-foreground">
            {analysis.companyName} · {analysis.role}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            지원동기 매칭
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            기업분석의 지원 각도와 실제 경험이 맞닿는 지점을 고릅니다.
          </p>
        </header>

        <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-normal">
              경험 선택
            </h2>
            <MotivationRunner analysis={analysis} experiences={experiences} />
          </div>

          <aside className="rounded-md border bg-card p-5 text-card-foreground">
            <h2 className="text-lg font-semibold tracking-normal">분석 요약</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {analysis.result.overview}
            </p>
            <Button asChild className="mt-5 w-full" variant="secondary">
              <Link href={`/dashboard/analyses/${analysis.id}`}>분석 열기</Link>
            </Button>
          </aside>
        </section>
      </div>
    </main>
  );
}
