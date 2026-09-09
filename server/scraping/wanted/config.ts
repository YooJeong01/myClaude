/**
 * 원티드(wanted.co.kr) 스크래핑 설정.
 *
 * 인증 없이 접근 가능한 채용 리스트 JSON API만 사용한다.
 * 개발 직군 전체를 가져온 뒤 role-filter로 프론트엔드/웹 관련 공고를 보수적으로 남긴다.
 */

export const WANTED_BASE_URL = 'https://www.wanted.co.kr';
export const WANTED_RESULTS_PATH = '/api/chaos/navigation/v1/results';
export const WANTED_JOB_GROUP_ID = '518';
export const WANTED_PAGE_SIZE = 20;
export const MAX_PAGES = Number(process.env.SCRAPE_MAX_PAGES) || 10;
