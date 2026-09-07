/**
 * 종합 프롬프트 빌더.
 *
 * 프롬프트 방향이 바뀔 수 있으므로 synthesize.ts 에서 분리해 여기에만 둔다.
 * 시스템 지침 / 섹션 포맷터 / 최종 조립을 각각 함수로 쪼개 부분 교체가 쉽게 한다.
 */

import type { DartKeyFinancials } from "../dart/types";
import type { HankyungReport } from "../hankyung/types";
import type { SanitizedNewsItem } from "../naver/types";
import type { SynthesisInput } from "./types";

export const SYNTHESIS_SYSTEM_INSTRUCTION = `너는 채용 지원자를 돕는 기업분석 애널리스트다.
아래 원칙을 지킨다:
- 제공된 자료(DART 재무, 뉴스 제목·요약, 애널리스트 리포트 제목)만 근거로 삼는다. 자료에 없는 사실을 지어내지 않는다.
- 뉴스 본문이나 리포트 원문을 그대로 옮기지 않는다. 종합하고 요약한다.
- 모든 출력은 한국어다.
- talking_points 는 이 회사에 지원하는 동기로 바로 쓸 수 있을 만큼 구체적으로 쓴다.
- 자료가 부족한 항목은 추측하지 말고 부족하다고 밝힌다.`;

/** 억(億) 단위 표기. 값이 없으면 "자료 없음". */
function formatKrw(value: number | null): string {
  if (value === null) return "자료 없음";
  const eok = value / 100_000_000;
  return `${eok.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}억 원`;
}

function financialsSection(financials: DartKeyFinancials | null): string {
  if (!financials) {
    return "## DART 재무\n(수집 실패 또는 자료 없음)";
  }
  const scope = financials.fsDiv === "CFS" ? "연결" : "개별";
  return [
    `## DART 재무 (${financials.bsnsYear} 사업연도, ${scope} 기준)`,
    `- 매출액: ${formatKrw(financials.revenue)}`,
    `- 영업이익: ${formatKrw(financials.operatingProfit)}`,
    `- 당기순이익: ${formatKrw(financials.netIncome)}`,
    `- 자산총계: ${formatKrw(financials.totalAssets)}`,
    `- 부채총계: ${formatKrw(financials.totalLiabilities)}`,
    `- 자본총계: ${formatKrw(financials.totalEquity)}`
  ].join("\n");
}

function newsSection(news: SanitizedNewsItem[]): string {
  if (news.length === 0) {
    return "## 최신 뉴스\n(수집 실패 또는 자료 없음)";
  }
  const lines = news
    .slice(0, 15)
    .map((n, i) => `${i + 1}. ${n.title}\n   ${n.description}`)
    .join("\n");
  return `## 최신 뉴스 (네이버 뉴스 검색, 제목·요약)\n${lines}`;
}

function reportsSection(reports: HankyungReport[]): string {
  if (reports.length === 0) {
    return "## 애널리스트 리포트\n(수집 실패 또는 자료 없음)";
  }
  const lines = reports
    .slice(0, 15)
    .map(
      (r, i) =>
        `${i + 1}. [${r.publishedDate}] ${r.title} — ${r.securitiesFirm}`
    )
    .join("\n");
  return `## 애널리스트 리포트 (한경컨센서스, 제목만)\n${lines}`;
}

export function buildSynthesisPrompt(input: SynthesisInput): string {
  const { profile, financials, news, reports, role } = input;

  const header = [
    `# 분석 대상: ${profile.corpName}`,
    profile.stockName ? `- 종목: ${profile.stockName} (${profile.stockCode ?? "비상장"})` : null,
    profile.ceoName ? `- 대표: ${profile.ceoName}` : null,
    profile.industryCode ? `- 업종코드: ${profile.industryCode}` : null,
    profile.establishedDate ? `- 설립: ${profile.establishedDate}` : null,
    profile.homepageUrl ? `- 홈페이지: ${profile.homepageUrl}` : null,
    role ? `\n지원 직무: ${role} — talking_points 를 이 직무 관점으로 맞출 것.` : null
  ]
    .filter(Boolean)
    .join("\n");

  return [
    header,
    "",
    financialsSection(financials),
    "",
    newsSection(news),
    "",
    reportsSection(reports),
    "",
    "---",
    "위 자료를 종합해 지정된 JSON 스키마로 기업분석 리포트를 작성하라."
  ].join("\n");
}
