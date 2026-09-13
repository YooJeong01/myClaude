import Link from "next/link";
import { redirect } from "next/navigation";

import {
  listAnalysesGrouped,
  type CompanyAnalysisGroup
} from "@/entities/company-analysis";
import { getUser } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, cardStyle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Tag } from "@/shared/ui/tag";
import { css } from "../../../../styled-system/css";

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
    <div className={css({ display: "flex", flexDirection: "column", gap: 6 })}>
        <header
          className={css({
            alignItems: { md: "flex-start" },
            borderBottomWidth: "1px",
            borderColor: "border",
            display: "flex",
            flexDirection: { base: "column", md: "row" },
            gap: 4,
            justifyContent: "space-between",
            pb: 5
          })}
        >
          <div>
            <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
              기업분석 모아보기
            </p>
            <h1 className={css({ mt: 2, textStyle: "3xl" })}>
              회사별 분석
            </h1>
          </div>
          <div className={css({ display: "flex", flexWrap: "wrap", gap: 2 })}>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">대시보드</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/calendar">채용 캘린더</Link>
            </Button>
          </div>
        </header>

        <form
          action="/dashboard/analyses"
          className={css({
            display: "flex",
            flexDirection: { base: "column", md: "row" },
            gap: 3
          })}
        >
          <Input
            className={css({ flex: 1 })}
            defaultValue={q}
            name="q"
            placeholder="회사명 검색"
          />
          <Button type="submit">검색</Button>
        </form>

        {rows.length > 0 ? (
          <div
            className={css({
              display: "grid",
              gap: 4,
              gridTemplateColumns: {
                base: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))"
              }
            })}
          >
            {rows.map((group) => (
              <CompanyAnalysisCard group={group} key={group.companyId} />
            ))}
          </div>
        ) : (
          <Card className={css({ color: "textMuted", p: 6, textStyle: "sm" })}>
            표시할 기업분석이 없습니다.
          </Card>
        )}

        {nextCursor ? (
          <div className={css({ display: "flex", justifyContent: "center" })}>
            <Button asChild variant="outline">
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
  );
}

function CompanyAnalysisCard({ group }: { group: CompanyAnalysisGroup }) {
  return (
    <Link
      className={cn(
        cardStyle,
        css({
          display: "block",
          p: 5,
          textDecoration: "none",
          transitionDuration: "fast",
          transitionProperty: "border-color",
          transitionTimingFunction: "standard",
          _hover: { borderColor: "link" }
        })
      )}
      href={`/dashboard/analyses/${group.latest.id}`}
    >
      <p className={css({ color: "textMuted", textStyle: "sm" })}>
        최신 분석 {dateFormatter.format(new Date(group.latest.createdAt))}
      </p>
      <h2 className={css({ mt: 2, textStyle: "lg" })}>
        {group.companyName}
      </h2>
      <p className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
        {group.latest.role}
      </p>
      {group.latest.result.estimated_size ? (
        <Tag className={css({ mt: 3, w: "fit-content" })} variant="yellow">
          {group.latest.result.estimated_size.label} 추정
        </Tag>
      ) : null}
      <p className={css({ color: "link", fontWeight: 500, mt: 4, textStyle: "sm" })}>
        {group.count}개 이력
      </p>
    </Link>
  );
}
