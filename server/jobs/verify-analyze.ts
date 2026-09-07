/**
 * 기업분석 전체 파이프라인 검증 (T23) — 수집 → 종합 → DB 저장.
 *
 * 인증(Day 8~9) 전이라 Route Handler 를 curl 로 못 친다.
 * SCRAPE_OWNER_USER_ID 유저 + service-role 로 route 와 같은 순서를 재현한다.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-analyze.ts [회사명] [직무]
 */
import { collectCompanySources } from "../analysis/collect";
import { insertCompanyAnalysis, upsertCompany } from "../analysis/persist";
import { synthesizeCompanyAnalysis } from "../analysis/synthesize";
import { resolveCorp } from "../dart/corp-codes";
import { createAdminClient } from "../supabase/admin";

async function main(): Promise<void> {
  const companyName = process.argv[2] ?? "삼성전자";
  const role = process.argv[3] ?? "프론트엔드 개발자";

  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    throw new Error("SCRAPE_OWNER_USER_ID 환경변수가 필요합니다.");
  }

  console.log(`🚀 기업분석 파이프라인 — "${companyName}" / "${role}"\n`);
  const admin = createAdminClient();

  const { match } = await resolveCorp(admin, companyName);
  if (!match) throw new Error(`'${companyName}' corp_code 해석 실패`);
  console.log(`  corp: ${match.corpName} (${match.corpCode})`);

  const sources = await collectCompanySources(match.corpCode, match.corpName);
  console.log(
    `  수집: 재무 ${sources.financials ? "O" : "X"} / 뉴스 ${sources.news.length} / 리포트 ${sources.reports.length}`
  );

  const companyId = await upsertCompany(admin, sources.profile);
  console.log(`  companies.id: ${companyId}`);

  console.log("  Gemini 종합 중...");
  const { result, sources: analysisSources, model } = await synthesizeCompanyAnalysis({
    role,
    profile: sources.profile,
    financials: sources.financials,
    news: sources.news,
    reports: sources.reports
  });

  const saved = await insertCompanyAnalysis(admin, {
    userId,
    companyId,
    role,
    result,
    sources: analysisSources,
    model
  });

  console.log(`\n  ✓ company_analyses.id: ${saved.id} (created_at ${saved.created_at})`);
  console.log(`  ✓ model: ${model}, schema v${result.schema_version}`);
  console.log(`  ✓ overview: ${result.overview.slice(0, 80)}...`);
  console.log(`  ✓ talking_points ${result.talking_points.length}개, risks ${result.risks.length}개`);
  console.log(
    `  ✓ sources: dart ${analysisSources.dart ? "O" : "X"} / news ${analysisSources.news.length} / consensus ${analysisSources.consensus.length}`
  );

  // 이력 누적(덮어쓰기 없음) 확인
  const { count } = await admin
    .from("company_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .eq("role", role);
  console.log(`  ✓ (user, company, role) 누적 이력: ${count}건`);

  console.log("\n✅ 파이프라인 검증 완료");
}

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("❌ 오류:", msg);
  process.exit(1);
});
