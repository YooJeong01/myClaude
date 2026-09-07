/**
 * 한경컨센서스(consensus.hankyung.com) 리포트 목록 스크래핑 설정.
 *
 * 리스크/이용범위 인지 사항:
 * - 한경컨센서스 페이지 하단은 자료의 전재, 복사, 대여를 금지한다고 고지한다.
 * - 본 모듈은 기업분석 AI 입력용 리포트 "목록 메타데이터"만 수집한다.
 * - 원문 PDF 본문이나 바이너리는 저장하지 않고, 원문 URL만 보존한다.
 * - 저강도 조회를 전제로 하며 429/5xx 응답은 공용 지수백오프 재시도 래퍼를 따른다.
 */

export const HANKYUNG_CONSENSUS_BASE_URL = 'https://consensus.hankyung.com';
export const HANKYUNG_REPORT_LIST_ENDPOINT = '/analysis/list';

export const DEFAULT_REPORT_TYPE = 'business';
export const DEFAULT_SEARCH_FIELD = 'REPORT_TITLE';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 80;
export const DEFAULT_RECENT_DAYS = 92;

export const REPORT_TYPE_LABELS: Record<string, string> = {
  business: '기업',
  industry: '산업',
  market: '시장',
  derivative: '파생',
  economy: '경제',
  stock_good: '상향',
  stock_bad: '하향'
};
