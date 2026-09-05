/**
 * 채용공고 수집(스크래핑/이메일) 공통 타입.
 *
 * 사이트 무관하게 사용되는 공통 데이터 구조와 enum.
 */

/** 채용공고 수집 출처 */
export type JobPostingSource = 'scrape_saramin' | 'scrape_jobkorea' | 'scrape_catch' | 'email';

/** 고용 형태 */
export type EmploymentType = '정규직' | '계약직' | '인턴' | '파견' | '프리랜서' | '기타';
export const EMPLOYMENT_TYPES: EmploymentType[] = [
  '정규직',
  '계약직',
  '인턴',
  '파견',
  '프리랜서',
  '기타'
];

/**
 * 수집된 채용공고 (정규화된 공통 포맷).
 *
 * 사이트별 파서가 이 타입으로 정규화해서 반환하면,
 * persist.ts 의 insertCollectedJobPostings 가 DB에 일괄 삽입한다.
 */
export interface CollectedJobPosting {
  companyNameRaw: string;
  role: string;
  employmentType: EmploymentType;
  postedAt?: Date | string; // ISO 또는 Date
  deadline?: Date | string;
  url?: string;
  rawText?: string;
}

/** 수집 결과 통계 */
export interface InsertResult {
  inserted: number;
  skipped: number;
}
