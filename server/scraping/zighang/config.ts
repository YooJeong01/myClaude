/**
 * 지행(zighang.com) 스크래핑 설정.
 *
 * 공개 JSON 리스트 API만 사용한다. Next.js/RSC 청크 파싱은 사용하지 않는다.
 */

export const ZIGHANG_BASE_URL = 'https://zighang.com';
export const ZIGHANG_API_BASE_URL = 'https://api.zighang.com/api/';
export const ZIGHANG_RECRUITMENTS_PATH = 'recruitments/v3';
export const ZIGHANG_PAGE_SIZE = 20;
export const MAX_PAGES = Number(process.env.SCRAPE_MAX_PAGES) || 3;
