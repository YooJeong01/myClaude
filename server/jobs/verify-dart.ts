/**
 * T4 DART 모듈 스모크 테스트.
 *
 * 선행: (1) .env.local 에 DART_API_KEY, (2) dart_corp_codes 마이그레이션 실행,
 *      (3) server/jobs/sync-dart-corp-codes.ts 로 목록 적재.
 *
 * 실행:
 *   NODE_OPTIONS=--experimental-websocket \
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-dart.ts
 */
import { fetchCompanyProfile, fetchKeyFinancials } from "../dart/client";
import { resolveCorp } from "../dart/corp-codes";
import { createAdminClient } from "../supabase/admin";

function ok(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  console.log("1. 회사명 → corp_code 해석 (삼성전자)");
  const { match, candidates } = await resolveCorp(admin, "삼성전자");
  assert(match, "삼성전자를 찾지 못함 — 동기화 잡을 먼저 실행하세요");
  ok(`corp_code=${match.corpCode}, name=${match.corpName}, stock=${match.stockCode ?? "-"}`);
  assert(match.corpCode === "00126380", `corp_code 기대값 00126380, 실제 ${match.corpCode}`);
  if (candidates.length > 1) ok(`후보 ${candidates.length}건 (상장사 우선 선택됨)`);

  console.log("2. 8자리 corp_code 직접 해석");
  const byCode = await resolveCorp(admin, "00126380");
  assert(byCode.match, "corp_code 직접 조회 실패");
  assert(byCode.match.corpName.includes("삼성전자"), "corp_code 직접 조회 결과 불일치");
  ok(byCode.match.corpName);

  console.log("3. 기업개황 (company.json)");
  const profile = await fetchCompanyProfile(match.corpCode);
  ok(`${profile.corpName} / 대표 ${profile.ceoName ?? "-"} / 설립 ${profile.establishedDate ?? "-"}`);

  console.log("4. 주요 재무 (fnlttSinglAcnt.json)");
  const fin = await fetchKeyFinancials(match.corpCode);
  ok(`${fin.bsnsYear}년 (${fin.fsDiv})`);
  console.log(`     매출액       ${format(fin.revenue)}`);
  console.log(`     영업이익     ${format(fin.operatingProfit)}`);
  console.log(`     당기순이익   ${format(fin.netIncome)}`);
  console.log(`     자산총계     ${format(fin.totalAssets)}`);
  console.log(`     부채총계     ${format(fin.totalLiabilities)}`);
  console.log(`     자본총계     ${format(fin.totalEquity)}`);
  assert(fin.revenue && fin.revenue > 0, "매출액이 비어 있음");

  console.log("\n✅ 전부 통과");
}

function format(n: number | null): string {
  if (n === null) return "(없음)";
  return `${(n / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 0 })} 억원`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
