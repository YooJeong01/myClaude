import { redirect } from "next/navigation";

import { listExperiences } from "@/entities/experience";
import { getUser } from "@/entities/session";
import {
  createExperience,
  editExperience,
  ExperienceForm,
  ExperienceList,
  removeExperience
} from "@/features/manage-experience";
import { createSupabaseServerClient } from "@/shared/api-server";

export default async function ExperiencesPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const experiences = await listExperiences(supabase);

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b pb-5">
          <p className="text-sm font-medium text-muted-foreground">
            {user.email ?? "로그인 사용자"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            내 경험
          </h1>
        </header>

        <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-md border bg-card p-5 text-card-foreground">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-normal">
                경험 추가
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                지원동기 매칭에 쓸 실제 프로젝트와 성과를 저장합니다.
              </p>
            </div>
            <ExperienceForm action={createExperience} />
          </div>

          <aside className="rounded-md border bg-card p-5 text-card-foreground">
            <p className="text-sm font-medium text-muted-foreground">
              저장된 경험
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-normal">
              {experiences.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              분석 결과와 함께 선택해 지원동기 소재 후보를 만듭니다.
            </p>
          </aside>
        </section>

        <section className="pb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-normal">경험 목록</h2>
          </div>
          <ExperienceList
            editAction={editExperience}
            experiences={experiences}
            removeAction={removeExperience}
          />
        </section>
      </div>
    </main>
  );
}
