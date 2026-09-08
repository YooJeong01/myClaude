import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getUser } from "@/entities/session";
import { Button } from "@/shared/ui/button";

export async function HeroView() {
  const user = await getUser();
  const dashboardHref = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">
            Company research workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            myClaude
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            채용 공고와 기업 분석 데이터를 한 흐름에서 정리하기 위한 Next.js
            기반 작업 공간입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={dashboardHref}>
                대시보드
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="secondary">
                <Link href="/dashboard/analyses">기업분석 목록</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
