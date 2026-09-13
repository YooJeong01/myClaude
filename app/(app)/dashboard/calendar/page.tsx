import Link from "next/link";
import { redirect } from "next/navigation";

import { listSavedPostingsWithDetail } from "@/entities/saved-posting";
import { getUser } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CalendarView } from "@/widgets/saved-calendar";
import { css } from "../../../../styled-system/css";

export default async function DashboardCalendarPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const savedPostings = await listSavedPostingsWithDetail(supabase);

  return (
    <div className={css({ display: "grid", gap: 6 })}>
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
              북마크한 공고
            </p>
            <h1 className={css({ mt: 2, textStyle: "3xl" })}>
              채용 캘린더
            </h1>
          </div>
          <div className={css({ display: "flex", flexWrap: "wrap", gap: 2 })}>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">대시보드</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/analyses">기업분석 목록</Link>
            </Button>
          </div>
        </header>

        {savedPostings.length > 0 ? (
          <CalendarView savedPostings={savedPostings} />
        ) : (
          <Card className={css({ color: "textMuted", p: 6, textStyle: "sm" })}>
            북마크한 공고가 없습니다.
          </Card>
        )}
    </div>
  );
}
