/**
 * 네이버 검색 API 설정.
 *
 * 참고: 이 API는 "공고 수집"용이 아니라 "기업분석의 최신 뉴스 검색"용.
 * 기업명을 입력하면 관련 뉴스를 찾아서, DART 재무데이터·한경컨센서스와 함께
 * AI 종합분석에 사용된다.
 *
 * 2026-06-25 NAVER API HUB 출시로 뉴스 검색 API가 이관됨 (신규 신청은
 * 2026-07-31 마감). NCP(NAVER Cloud Platform) 콘솔에서 발급받은 키를 사용.
 *
 * 엔드포인트: /search/v1/news
 * 요청 헤더: X-NCP-APIGW-API-KEY-ID, X-NCP-APIGW-API-KEY
 * 일일 한도: ~25,000회 (기본 할당량, NCP 콘솔 대시보드 재확인 권장)
 */

export function getNaverConfig() {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      '❌ 네이버 검색 API 클라이언트 자격증명 누락.\n' +
        '  1. https://apihub.naver.com/ (NCP 계정) 로그인\n' +
        '  2. 검색 API(뉴스) 신청 후 키 발급\n' +
        '  3. NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 .env.local에 저장'
    );
  }

  return { clientId, clientSecret };
}

export const NAVER_SEARCH_BASE_URL = 'https://naverapihub.apigw.ntruss.com';
export const NAVER_NEWS_ENDPOINT = '/search/v1/news';

/** 한 번에 검색할 최대 뉴스 기사 개수 (최대 100) */
export const DEFAULT_DISPLAY = 10;

/** 정렬 방식: sim(유사도), date(최신순) */
export const DEFAULT_SORT = 'date';
