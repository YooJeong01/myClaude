/**
 * 지원동기 매칭 파이프라인 검증 (T27) — 기존 기업분석 + 임시 경험 → Gemini → DB 저장.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-motivation.ts
 */
import type { CompanyAnalysisResult } from "../analysis/types";
import { generateMotivation } from "../motivation/generate";
import type { MotivationResult } from "../motivation/types";
import { createAdminClient } from "../supabase/admin";
import type { Json } from "../supabase/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertMotivationResult(result: MotivationResult): void {
  assert(result.angles.length > 0, "angles 가 비어 있음");
  for (const [index, angle] of result.angles.entries()) {
    assert(angle.point.trim(), `angles[${index}].point 누락`);
    assert(
      angle.matched_experience.trim(),
      `angles[${index}].matched_experience 누락`
    );
    assert(angle.connection.trim(), `angles[${index}].connection 누락`);
    assert(
      angle.draft_sentences.length > 0 &&
        angle.draft_sentences.every((sentence) => sentence.trim()),
      `angles[${index}].draft_sentences 누락`
    );
  }
  assert(result.summary_paragraph.trim(), "summary_paragraph 누락");
}

async function main(): Promise<void> {
  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    throw new Error("SCRAPE_OWNER_USER_ID 환경변수가 필요합니다.");
  }

  console.log("🚀 지원동기 매칭 스모크\n");
  const admin = createAdminClient();

  const { data: analysis, error: analysisError } = await admin
    .from("company_analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  assert(!analysisError, `company_analyses 조회: ${analysisError?.message}`);
  if (!analysis) {
    console.log("company_analyses 행이 없습니다. verify-analyze.ts 를 먼저 실행하세요.");
    return;
  }
  console.log(`  company_analyses.id: ${analysis.id}`);

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("name")
    .eq("id", analysis.company_id)
    .single();
  assert(!companyError && company, `companies 조회: ${companyError?.message}`);
  console.log(`  company: ${company.name} / role: ${analysis.role}`);

  const tempExperiences = [
    {
      user_id: userId,
      title: "React 성능 최적화 프로젝트",
      body: "렌더링 병목을 측정하고 메모이제이션, 코드 스플리팅, 이미지 최적화로 주요 화면 진입 시간을 줄였다."
    },
    {
      user_id: userId,
      title: "사내 디자인시스템 구축",
      body: "반복되는 UI 패턴을 컴포넌트로 정리하고 접근성 기준과 사용 가이드를 함께 만들어 개발 속도와 일관성을 높였다."
    },
    {
      user_id: userId,
      title: "고객 피드백 기반 온보딩 개선",
      body: "지원자가 이탈하는 단계를 분석해 입력 흐름과 안내 문구를 개선했고, 실험 결과를 기반으로 다음 개선안을 도출했다."
    }
  ];

  const { data: experiences, error: experiencesError } = await admin
    .from("user_experiences")
    .insert(tempExperiences)
    .select("id, title, body");
  assert(
    !experiencesError && experiences?.length === tempExperiences.length,
    `user_experiences insert: ${experiencesError?.message}`
  );
  console.log(`  임시 경험 ${experiences.length}개 생성`);

  try {
    console.log("  Gemini 매칭 중...");
    const { result, model } = await generateMotivation({
      role: analysis.role,
      companyName: company.name,
      analysis: analysis.result as unknown as CompanyAnalysisResult,
      experiences: experiences.map((experience) => ({
        title: experience.title,
        body: experience.body
      }))
    });
    assertMotivationResult(result);

    const experienceIds = experiences.map((experience) => experience.id);
    const { data: draft, error: draftError } = await admin
      .from("motivation_drafts")
      .insert({
        user_id: userId,
        company_analysis_id: analysis.id,
        job_posting_id: analysis.job_posting_id,
        experience_ids: experienceIds,
        result: result as unknown as Json,
        model
      })
      .select("id, created_at")
      .single();
    assert(!draftError && draft, `motivation_drafts insert: ${draftError?.message}`);

    const { count, error: countError } = await admin
      .from("motivation_drafts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("company_analysis_id", analysis.id);
    assert(!countError, `motivation_drafts count: ${countError?.message}`);

    console.log(`\n  ✓ motivation_drafts.id: ${draft.id} (${draft.created_at})`);
    console.log(`  ✓ model: ${model}, schema v${result.schema_version}`);
    console.log(`  ✓ angles ${result.angles.length}개`);
    console.log(`  ✓ (user, company_analysis_id) 누적 이력: ${count}건`);
    console.log("\n✅ 지원동기 매칭 검증 완료");
  } finally {
    const ids = experiences.map((experience) => experience.id);
    const { error: cleanupError } = await admin
      .from("user_experiences")
      .delete()
      .in("id", ids);
    if (cleanupError) {
      console.warn(`  ! 임시 경험 정리 실패: ${cleanupError.message}`);
    } else {
      console.log(`  ✓ 임시 경험 ${ids.length}개 삭제`);
    }
  }
}

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("❌ 오류:", msg);
  process.exit(1);
});
