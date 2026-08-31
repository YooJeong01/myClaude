/**
 * DART Open API 응답/도메인 타입.
 *
 * 프레임워크 무관 계층(server/). Next.js import 금지.
 * 공식 문서: https://opendart.fss.or.kr/guide/main.do
 */

/** corpCode.xml 한 항목 (dart_corp_codes 테이블 행과 1:1). */
export interface DartCorpEntry {
  corpCode: string; // 8자리
  corpName: string;
  corpEngName: string | null;
  stockCode: string | null; // 상장사만, 6자리
  modifyDate: string | null; // YYYY-MM-DD
}

/** company.json — 기업개황. */
export interface DartCompanyProfile {
  corpCode: string;
  corpName: string;
  corpNameEng: string | null;
  stockName: string | null;
  stockCode: string | null;
  ceoName: string | null;
  /** Y 유가증권 / K 코스닥 / N 코넥스 / E 기타 */
  corpClass: string | null;
  industryCode: string | null;
  establishedDate: string | null; // YYYY-MM-DD
  accountMonth: string | null; // 결산월 "12"
  homepageUrl: string | null;
  address: string | null;
}

/** fnlttSinglAcnt.json 응답 list 원소(카멜케이스 정리 전 raw). */
export interface DartFinancialRow {
  fs_div: string; // CFS 연결 / OFS 개별
  fs_nm: string;
  sj_div: string; // BS 재무상태표 / IS 손익계산서
  account_nm: string;
  thstrm_amount: string;
  frmtrm_amount: string;
  bfefrmtrm_amount: string;
  thstrm_nm: string;
  frmtrm_nm: string;
  bfefrmtrm_nm: string;
}

/** 주요 재무 정리본. 금액 단위는 원(KRW). 값이 없으면 null. */
export interface DartKeyFinancials {
  bsnsYear: string;
  reprtCode: string;
  /** 연결(CFS) 우선, 없으면 개별(OFS) */
  fsDiv: "CFS" | "OFS";
  revenue: number | null; // 매출액
  operatingProfit: number | null; // 영업이익
  netIncome: number | null; // 당기순이익
  totalAssets: number | null; // 자산총계
  totalLiabilities: number | null; // 부채총계
  totalEquity: number | null; // 자본총계
}

export type DartErrorCode =
  | "NO_API_KEY"
  | "INVALID_KEY" // status 100/101
  | "RATE_LIMITED" // status 020
  | "NO_DATA" // status 013
  | "DART_ERROR" // 기타 status
  | "HTTP_ERROR"; // 네트워크/HTTP

export class DartApiError extends Error {
  readonly code: DartErrorCode;
  readonly status?: string;

  constructor(code: DartErrorCode, message: string, status?: string) {
    super(message);
    this.name = "DartApiError";
    this.code = code;
    this.status = status;
  }
}
