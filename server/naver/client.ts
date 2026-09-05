/**
 * 네이버 뉴스 검색 클라이언트.
 *
 * 기업명으로 관련 뉴스를 검색한다 (기업분석 AI 입력용).
 */
import { naverGet } from './http';
import type { NaverSearchResponse, SanitizedNewsItem } from './types';
import { NAVER_NEWS_ENDPOINT, DEFAULT_DISPLAY, DEFAULT_SORT } from './config';

/**
 * HTML 엔티티를 디코딩한다.
 * 예: "&lt;strong&gt;" → "<strong>"
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&nbsp;': ' '
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }
  return result;
}

/**
 * 기업명으로 최신 뉴스를 검색한다.
 *
 * @param companyName 기업명 (예: "삼성전자")
 * @param display 조회할 뉴스 개수 (1~100, 기본 10)
 * @returns 정규화된 뉴스 항목 배열
 */
export async function fetchCompanyNews(
  companyName: string,
  display: number = DEFAULT_DISPLAY
): Promise<SanitizedNewsItem[]> {
  if (!companyName || companyName.trim().length === 0) {
    throw new Error('기업명이 비어있습니다.');
  }

  try {
    const response = await naverGet<NaverSearchResponse>(NAVER_NEWS_ENDPOINT, {
      query: companyName,
      display: Math.min(display, 100),
      sort: DEFAULT_SORT
    });

    // HTML 엔티티 디코딩
    return response.items.map((item) => ({
      title: decodeHtmlEntities(item.title),
      link: item.link,
      description: decodeHtmlEntities(item.description),
      pubDate: item.pubDate
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`네이버 뉴스 검색 실패 ("${companyName}"): ${msg}`);
  }
}
