/**
 * 사람인(saramin.co.kr) 스크래핑 설정.
 *
 * ⚠️ 리스크 인지 사항:
 * - 사람인 기업회원약관 제23조에서 "회사의 명시적인 사전 동의 없이 크롤링, API 통신 등을 통한
 *   자동화된 수단을 활용한 접근·수집을 엄격히 금지"한다고 명시.
 * - 실제로 사람인은 크롤링 관련 소송 사례가 있는 민감한 기업.
 * - 본 프로젝트는 개인 포트폴리오용 저강도 사용(소수 키워드, 하루 2회만, 트래픽 낮게, 재배포 없음)
 *   을 전제로 이 리스크를 감수하기로 결정했다.
 */

function getScrapeKeywords(): string[] {
  const raw = process.env.SCRAPE_SEARCH_KEYWORDS ?? '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export const SARAMIN_BASE_URL = 'https://www.saramin.co.kr';
export const SARAMIN_SEARCH_ENDPOINT = '/zf_user/search/recruit';

/**
 * 스크래핑할 검색 키워드.
 * 환경변수 `SCRAPE_SEARCH_KEYWORDS`(콤마구분)에서 읽음.
 * 예: "프론트엔드,백엔드,풀스택"
 */
export const SEARCH_KEYWORDS = getScrapeKeywords();

/**
 * 각 키워드별 최대 페이지 수.
 * 저강도 유지를 위해 상한을 잡아둔다. (1페이지당 40건 ~ 100건)
 */
export const MAX_PAGES_PER_KEYWORD = Number(process.env.SCRAPE_MAX_PAGES) || 10;

/**
 * robots.txt 준수 여부 확인:
 * - 검색 페이지(`/zf_user/search/recruit`): 명시적 Disallow 없음 ✓ 허용
 * - 상세 페이지(`/zf_user/jobs/relay/view`): 명시적 차단 없음 ✓ 허용
 * - GPTBot, Bytespider: Disallow 있음. 일반 User-Agent는 무관.
 */
