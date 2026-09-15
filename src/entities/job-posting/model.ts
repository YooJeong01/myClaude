import { type CareerLevel } from "@server/job-postings/types";

export const EMPLOYMENT_TYPES = [
  "정규직",
  "계약직",
  "인턴",
  "파견",
  "프리랜서",
  "기타"
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export { CAREER_LEVELS, type CareerLevel } from "@server/job-postings/types";

export type JobPosting = {
  id: string;
  companyNameRaw: string | null;
  role: string;
  employmentType: EmploymentType;
  careerLevel: CareerLevel | null;
  postedAt: string | null;
  deadline: string | null;
  source: string;
  url: string | null;
  rawText: string | null;
  createdAt: string;
};

export type NewJobPostingInput = {
  companyNameRaw?: string;
  role: string;
  employmentType: EmploymentType;
  careerLevel?: CareerLevel | null;
  postedAt?: string;
  deadline?: string;
  url?: string;
  rawText?: string;
};

export function validateNewJobPosting(input: NewJobPostingInput): string | null {
  if (!input.role.trim()) {
    return "직무를 입력하세요.";
  }
  if (!input.url?.trim() && !input.rawText?.trim()) {
    return "공고 URL 또는 공고 본문 중 하나는 입력해야 합니다.";
  }
  return null;
}
