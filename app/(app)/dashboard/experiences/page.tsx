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
import { Card } from "@/shared/ui/card";
import { css } from "../../../../styled-system/css";

export default async function ExperiencesPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const experiences = await listExperiences(supabase);

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: 6 })}>
        <header
          className={css({
            borderBottomWidth: "1px",
            borderColor: "border",
            pb: 5
          })}
        >
          <h1 className={css({ textStyle: "3xl" })}>
            내 경험
          </h1>
        </header>

        <section
          className={css({
            display: "grid",
            gap: 6,
            gridTemplateColumns: { base: "1fr", md: "minmax(0, 1fr) 24rem" }
          })}
        >
          <Card className={css({ p: 5 })}>
            <div className={css({ mb: 5 })}>
              <h2 className={css({ textStyle: "lg" })}>
                경험 추가
              </h2>
              <p className={css({ color: "textMuted", mt: 1, textStyle: "sm" })}>
                지원동기 매칭에 쓸 실제 프로젝트와 성과를 저장합니다.
              </p>
            </div>
            <ExperienceForm action={createExperience} />
          </Card>

          <Card className={css({ p: 5 })}>
            <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>
              저장된 경험
            </p>
            <p className={css({ mt: 2, textStyle: "3xl" })}>
              {experiences.length}
            </p>
            <p className={css({ color: "textMuted", mt: 2, textStyle: "sm" })}>
              분석 결과와 함께 선택해 지원동기 소재 후보를 만듭니다.
            </p>
          </Card>
        </section>

        <section className={css({ pb: 8 })}>
          <div
            className={css({
              alignItems: "center",
              display: "flex",
              gap: 3,
              justifyContent: "space-between",
              mb: 4
            })}
          >
            <h2 className={css({ textStyle: "lg" })}>경험 목록</h2>
          </div>
          <ExperienceList
            editAction={editExperience}
            experiences={experiences}
            removeAction={removeExperience}
          />
        </section>
    </div>
  );
}
