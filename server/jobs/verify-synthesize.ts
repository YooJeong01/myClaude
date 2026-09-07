/**
 * 기업분석 종합(T21) 스모크 — DB/Route 없이 파이프라인만.
 *
 * DART + 네이버 + 한경컨센서스를 실제로 수집해서 synthesizeCompanyAnalysis 에 넣고,
 * 결과 JSON 이 스키마대로 채워지는지 확인한다.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-synthesize.ts [회사명]
 */
import { createAdminClient } from "../supabase/admin";
import { fetchCompanyProfile, fetchKeyFinancials } from "../dart/client";
import { resolveCorp } from "../dart/corp-codes";
import { fetchCompanyNews } from "../naver/client";
import { fetchRecentReports } from "../hankyung/client";
import { synthesizeCompanyAnalysis } from "../analysis/synthesize";

async function main(): Promise<void> {
  const companyName = process.argv[2] ?? "삼성전자";
  console.log(`🚀 기업분석 종합 스모크 — "${companyName}"\n`);

  const admin = createAdminClient();
  const { match } = await resolveCorp(admin, companyName);
  if (!match) {
    throw new Error(`'${companyName}' corp_code 해석 실패`);
  }
  console.log(`  corp_code: ${match.corpCode} (${match.corpName})`);

  const [profile, financials, news, reports] = await Promise.all([
    fetchCompanyProfile(match.corpCode),
    fetchKeyFinancials(match.corpCode).catch((e: unknown) => {
      console.warn(`  ⚠ 재무 수집 실패: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }),
    fetchCompanyNews(companyName, 10).catch((e: unknown) => {
      console.warn(`  ⚠ 뉴스 수집 실패: ${e instanceof Error ? e.message : String(e)}`);
      return [];
    }),
    fetchRecentReports({ stockName: companyName, limit: 10 }).catch((e: unknown) => {
      console.warn(`  ⚠ 컨센서스 수집 실패: ${e instanceof Error ? e.message : String(e)}`);
      return [];
    })
  ]);
  console.log(
    `  수집: 재무 ${financials ? "O" : "X"} / 뉴스 ${news.length}건 / 리포트 ${reports.length}건\n`
  );

  console.log("  Gemini 종합 중...");
  const { result, sources, model } = await synthesizeCompanyAnalysis({
    role: "프론트엔드 개발자",
    profile,
    financials,
    news,
    reports
  });

  console.log(`\n=== result (model: ${model}, schema v${result.schema_version}) ===`);
  console.log(`overview: ${result.overview}`);
  console.log(`financials_summary: ${result.financials_summary}`);
  console.log(`recent_news_themes: ${result.recent_news_themes.join(" / ")}`);
  console.log(`analyst_view: ${result.analyst_view}`);
  console.log(`risks: ${result.risks.join(" / ")}`);
  console.log(`talking_points:`);
  for (const tp of result.talking_points) console.log(`  - ${tp}`);

  console.log(`\n=== sources ===`);
  console.log(`dart: ${JSON.stringify(sources.dart)}`);
  console.log(`news: ${sources.news.length}건, consensus: ${sources.consensus.length}건`);

  console.log("\n✅ 스모크 완료");
}

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("❌ 오류:", msg);
  process.exit(1);
});
