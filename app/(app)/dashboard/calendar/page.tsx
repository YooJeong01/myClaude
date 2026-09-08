import Link from "next/link";
import { redirect } from "next/navigation";

import { listSavedPostingsWithDetail } from "@/entities/saved-posting";
import { getUser } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";
import { Button } from "@/shared/ui/button";
import { CalendarView } from "@/widgets/saved-calendar";

export default async function DashboardCalendarPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const savedPostings = await listSavedPostingsWithDetail(supabase);

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              북마크한 공고
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              채용 캘린더
            </h1>
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard">대시보드</Link>
          </Button>
        </header>

        {savedPostings.length > 0 ? (
          <CalendarView savedPostings={savedPostings} />
        ) : (
          <div className="rounded-md border bg-card p-6 text-sm leading-6 text-muted-foreground">
            북마크한 공고가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}
