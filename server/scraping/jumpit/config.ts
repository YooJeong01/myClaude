/**
 * 점핏(jumpit.co.kr) 스크래핑 설정.
 *
 * 인증 없이 접근 가능한 사람인 점핏 JSON API만 사용한다.
 * 직무 파라미터는 확정하지 않고 전체 목록을 받은 뒤 role-filter로 보수적으로 거른다.
 */

export const JUMPIT_BASE_URL = 'https://www.jumpit.co.kr';
export const JUMPIT_API_BASE_URL = 'https://jumpit-api.saramin.co.kr';
export const JUMPIT_POSITIONS_PATH = '/api/positions';
export const MAX_PAGES = Number(process.env.SCRAPE_MAX_PAGES) || 10;
