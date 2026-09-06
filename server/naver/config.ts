/**
 * 네이버 검색 API 설정.
 *
 * 참고: 이 API는 "공고 수집"용이 아니라 "기업분석의 최신 뉴스 검색"용.
 * 기업명을 입력하면 관련 뉴스를 찾아서, DART 재무데이터·한경컨센서스와 함께
 * AI 종합분석에 사용된다.
 *
 * 엔드포인트: /v1/search/news.json
 * 요청 헤더: X-Naver-Client-Id, X-Naver-Client-Secret
 * 일일 한도: ~25,000회 (기본 할당량, 개발자센터 대시보드 재확인 권장)
 */

export function getNaverConfig() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      '❌ 네이버 검색 API 클라이언트 자격증명 누락.\n' +
        '  1. https://developers.naver.com/ 로그인\n' +
        '  2. 새 애플리케이션 등록 (검색 API 선택)\n' +
        '  3. Client ID, Client Secret 획득\n' +
        '  4. NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 .env.local에 저장'
    );
  }

  return { clientId, clientSecret };
}

export const NAVER_SEARCH_BASE_URL = 'https://openapi.naver.com';
export const NAVER_NEWS_ENDPOINT = '/v1/search/news.json';

/** 한 번에 검색할 최대 뉴스 기사 개수 (최대 100) */
export const DEFAULT_DISPLAY = 10;

/** 정렬 방식: sim(유사도), date(최신순) */
export const DEFAULT_SORT = 'date';
