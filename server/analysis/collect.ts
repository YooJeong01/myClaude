/**
 * 기업분석 소스 수집.
 *
 * corp_code 하나로 DART 개황·재무 + 네이버 뉴스 + 한경컨센서스를 병렬 수집한다.
 * 개황(profile)은 필수 — 실패하면 throw. 나머지는 실패해도 null/[] 로 진행한다
 * (한 소스가 죽어도 나머지로 분석은 가능해야 함).
 *
 * 소스가 늘어나면 여기에 fetch 를 추가하고 CollectedSources / SynthesisInput 를 넓힌다.
 */

import { fetchCompanyProfile, fetchKeyFinancials } from "../dart/client";
import type { DartCompanyProfile, DartKeyFinancials } from "../dart/types";
import { fetchRecentReports } from "../hankyung/client";
import type { HankyungReport } from "../hankyung/types";
import { fetchCompanyNews } from "../naver/client";
import type { SanitizedNewsItem } from "../naver/types";

export interface CollectedSources {
  profile: DartCompanyProfile;
  financials: DartKeyFinancials | null;
  news: SanitizedNewsItem[];
  reports: HankyungReport[];
}

function warnFail(label: string, err: unknown): null {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[analysis/collect] ${label} 수집 실패: ${msg}`);
  return null;
}

export async function collectCompanySources(
  corpCode: string,
  companyName: string
): Promise<CollectedSources> {
  const [profile, financials, news, reports] = await Promise.all([
    fetchCompanyProfile(corpCode),
    fetchKeyFinancials(corpCode).catch((e: unknown) => warnFail("DART 재무", e)),
    fetchCompanyNews(companyName, 12).catch((e: unknown) => {
      warnFail("네이버 뉴스", e);
      return [] as SanitizedNewsItem[];
    }),
    fetchRecentReports({ stockName: companyName, limit: 12 }).catch((e: unknown) => {
      warnFail("한경컨센서스", e);
      return [] as HankyungReport[];
    })
  ]);

  return { profile, financials, news, reports };
}
