/**
 * 캐치(catch.co.kr) 스크래핑 설정.
 *
 * robots.txt 분석:
 * - `/Search`: Disallow ❌
 * - `/NCS/RecruitSearch`: (명시 없음) ✓ 허용
 * - `/Comp/RecruitInfo/`: (명시 없음) ✓ 허용
 *
 * 이 스크래퍼는 robots.txt에 허용된 경로만 사용한다.
 * `/NCS/RecruitSearch` 또는 내부 API를 직접 호출.
 *
 * ⚠️ 리스크 인지 사항:
 * - 캐치 이용약관 제19조에서 "크롤링, 스크래핑, 데이터 마이닝" 명시적 금지.
 * - 특히 "인공지능 학습·데이터분석 목적 활용"을 별도로 금지.
 * - 본 프로젝트는 개인 포트폴리오용 저강도 사용을 전제로 이 리스크를 감수하기로 결정함.
 *
 * ⚠️ 기술 주의사항:
 * - Nuxt 기반, 메타태그만 SSR이고 실제 리스트는 CSR.
 * - Playwright로 렌더링 후 콘텐츠 추출 필수.
 */

function getScrapeKeywords(): string[] {
  const raw = process.env.SCRAPE_SEARCH_KEYWORDS ?? '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export const CATCH_BASE_URL = 'https://www.catch.co.kr';
export const CATCH_SEARCH_PATH = '/NCS/RecruitSearch';

export const SEARCH_KEYWORDS = getScrapeKeywords();
export const MAX_PAGES_PER_KEYWORD = Number(process.env.SCRAPE_MAX_PAGES) || 3;

/**
 * Playwright 네비게이션/렌더링 타임아웃.
 * Nuxt 초기화와 콘텐츠 로드 시간 확보.
 */
export const NAVIGATION_TIMEOUT_MS = 15_000;
export const CONTENT_LOAD_TIMEOUT_MS = 10_000;
