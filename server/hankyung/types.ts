/**
 * 한경컨센서스 리포트 메타데이터 타입.
 *
 * 원문 PDF 본문/바이너리는 저장 대상이 아니다.
 */

export interface HankyungReport {
  title: string;
  securitiesFirm: string;
  stockName: string | null;
  stockCode: string | null;
  reportType: string;
  publishedDate: string;
  originalUrl: string;
  author: string | null;
}

export interface FetchRecentReportsOptions {
  keyword?: string;
  stockName?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
