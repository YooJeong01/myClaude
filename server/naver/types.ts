/**
 * 네이버 검색 API 타입.
 */

/** 네이버 뉴스 검색 응답의 단일 항목 */
export interface NaverNewsItem {
  title: string; // HTML 엔티티 포함 (예: "회사명 &lt;strong&gt;뉴스&lt;/strong&gt;")
  originallink: string; // 기사 원본 링크 (예: https://news.naver.com/...)
  link: string; // 네이버 뉴스 링크
  description: string; // 기사 요약 (HTML 엔티티 포함)
  pubDate: string; // 발행일 (RFC 822 형식, 예: "Thu, 05 Sep 2026 10:30:00 +0900")
}

/** 네이버 검색 API 응답 */
export interface NaverSearchResponse {
  lastBuildDate: string; // 응답 생성 시간
  total: number; // 검색 결과 총 개수
  start: number; // 검색 시작 위치
  display: number; // 이번 응답에 포함된 항목 수
  items: NaverNewsItem[];
}

/** HTML 엔티티 제거 후의 정규화된 뉴스 항목 */
export interface SanitizedNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}
