/**
 * 잡코리아(jobkorea.co.kr) 스크래핑 설정.
 *
 * robots.txt 분석:
 * - `/Search/?stext=` (검색 결과 페이지): 명시적 Disallow ❌
 * - `/recruit/joblist`: Allow ✓
 * - `/Recruit/GI_Read` (상세 페이지): Allow ✓
 *
 * 이 스크래퍼는 robots.txt에 허용된 경로만 사용한다.
 * `/recruit/joblist` 또는 API 경로를 직접 호출해서 공고를 수집한다.
 *
 * ⚠️ 기술 주의사항:
 * - 페이지가 Next.js CSR(클라이언트 렌더링)이라 Playwright 필수.
 * - 네비게이션 후 동적 콘텐츠 로드 대기 필요.
 */

function getScrapeKeywords(): string[] {
  const raw = process.env.SCRAPE_SEARCH_KEYWORDS ?? '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export const JOBKOREA_BASE_URL = 'https://www.jobkorea.co.kr';

/**
 * 잡코리아 공개 API 엔드포인트 (robots.txt 미언급, 외부 문서로 확인 필요).
 * 또는 /recruit/joblist 페이지를 Playwright로 렌더링.
 */
export const JOBKOREA_SEARCH_PATH = '/recruit/joblist';

export const SEARCH_KEYWORDS = getScrapeKeywords();
export const MAX_PAGES_PER_KEYWORD = Number(process.env.SCRAPE_MAX_PAGES) || 10;

/**
 * Playwright 네비게이션/렌더링 타임아웃.
 * CSR이라 콘텐츠 로드를 명시적으로 기다려야 함.
 */
export const NAVIGATION_TIMEOUT_MS = 15_000;
export const CONTENT_LOAD_TIMEOUT_MS = 10_000;
