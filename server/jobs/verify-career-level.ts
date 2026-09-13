/**
 * career_level 추출 규칙을 콘솔로 확인한다.
 *
 * 실행:
 *   pnpm exec tsx server/jobs/verify-career-level.ts
 */

import { extractCareerLevel } from "../job-postings/career-level";

const samples = [
  "프론트엔드 개발자 신입 채용",
  "백엔드 개발자 경력 3년 이상",
  "서비스 기획자 신입/경력",
  "데이터 분석가 경력무관",
  "인턴형 소프트웨어 엔지니어"
];

for (const sample of samples) {
  console.log(`${sample} -> ${extractCareerLevel(sample) ?? "null"}`);
}
