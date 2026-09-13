import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAnalysis } from "@/entities/company-analysis";
import { listExperiences } from "@/entities/experience";
import { listDraftsForAnalysis } from "@/entities/motivation-draft";
import { getUser } from "@/entities/session";
import { MotivationRunner } from "@/features/run-motivation";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { css } from "../../../../../../styled-system/css";

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
  const [analysis, experiences, drafts] = await Promise.all([
    getAnalysis(supabase, id),
    listExperiences(supabase),
    listDraftsForAnalysis(supabase, id)
  ]);
  if (!analysis) {
    notFound();
  }

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: 6 })}>
        <header className={css({ borderBottomWidth: "1px", borderColor: "border", pb: 5 })}>
          <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
            {analysis.companyName} · {analysis.role}
          </p>
          <h1 className={css({ mt: 2, textStyle: "3xl" })}>
            지원동기 매칭
          </h1>
          <p className={css({ color: "textMuted", maxW: "2xl", mt: 3, textStyle: "sm" })}>
            기업분석의 지원 각도와 실제 경험이 맞닿는 지점을 고릅니다.
          </p>
        </header>

        <section
          className={css({
            display: "grid",
            gap: 6,
            gridTemplateColumns: { base: "1fr", md: "minmax(0, 1fr) 22rem" }
          })}
        >
          <div>
            <h2 className={css({ mb: 4, textStyle: "lg" })}>
              경험 선택
            </h2>
            <MotivationRunner analysis={analysis} experiences={experiences} />
          </div>

          <Card className={css({ p: 5 })}>
            <h2 className={css({ textStyle: "lg" })}>분석 요약</h2>
            <p className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
              {analysis.result.overview}
            </p>
            <Button asChild className={css({ mt: 5, w: "full" })} variant="secondary">
              <Link href={`/dashboard/analyses/${analysis.id}`}>분석 열기</Link>
            </Button>
          </Card>
        </section>

        <section className={css({ pb: 8 })}>
          <h2 className={css({ mb: 4, textStyle: "lg" })}>
            지원동기 이력
          </h2>
          {drafts.length > 0 ? (
            <Card
              className={css({
                "& > article + article": {
                  borderColor: "border",
                  borderTopWidth: "1px"
                }
              })}
            >
              {drafts.map((draft) => (
                <article
                  className={css({
                    alignItems: { md: "center" },
                    display: "flex",
                    flexDirection: { base: "column", md: "row" },
                    gap: 3,
                    justifyContent: "space-between",
                    p: 4
                  })}
                  key={draft.id}
                >
                  <div>
                    <p className={css({ fontWeight: 500, textStyle: "sm" })}>
                      경험 {draft.experienceIds.length}개 조합
                    </p>
                    <p className={css({ color: "textMuted", mt: 1, textStyle: "sm" })}>
                      {new Intl.DateTimeFormat("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(new Date(draft.createdAt))}
                    </p>
                  </div>
                  <Link
                    className={css({
                      color: "link",
                      fontWeight: 500,
                      textDecoration: "none",
                      textStyle: "sm",
                      textUnderlineOffset: "4px",
                      _hover: { textDecoration: "underline" }
                    })}
                    href={`/dashboard/drafts/${draft.id}`}
                  >
                    결과 열기
                  </Link>
                </article>
              ))}
            </Card>
          ) : (
            <Card className={css({ color: "textMuted", p: 5, textStyle: "sm" })}>
              아직 이 분석으로 만든 지원동기 이력이 없습니다.
            </Card>
          )}
        </section>
    </div>
  );
}
