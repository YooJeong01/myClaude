# 공고 목록 필터 구현 완료

- 2026-09-14 08:56
- 브랜치: `feat/job-listing-filters`
- base: `main` @ `a39901c`
- main 병합/push: 하지 않음

## T## 완료 상태

- T1 완료: `deadline` `timestamptz` 마이그레이션 파일과 `endOfDayKstToIso()` 추가.
- T2 완료: `career_level` 마이그레이션, `CareerLevel` 단일 소스, DB/엔티티 타입 반영.
- T3 완료: 스크래퍼 저장/수동 입력 deadline을 KST 23:59:59 ISO로 저장.
- T4 완료: career_level 자동 추출, 저장 연동, verify/backfill 스크립트 추가.
- T5 완료: `listJobPostings`를 cursor에서 offset/page 기반으로 전환, `showClosed`/`onlyClosed`/`careerLevel` 반영.
- T6 완료: KST 기준 D-day 배지 판정 유틸 추가.
- T7 완료: 대시보드 검색 파라미터, 필터폼, 숫자 페이지네이션, D-day 배지 UI 반영.

## 생성/수정 파일

- 생성: `supabase/migrations/20260914090000_job_postings_deadline_timestamptz.sql`
- 생성: `supabase/migrations/20260914090100_job_postings_career_level.sql`
- 생성: `server/job-postings/kst-deadline.ts`
- 생성: `server/job-postings/career-level.ts`
- 생성: `server/jobs/verify-career-level.ts`
- 생성: `server/jobs/backfill-career-level.ts`
- 생성: `src/entities/job-posting/d-day.ts`
- 수정: `server/job-postings/types.ts`
- 수정: `server/job-postings/persist.ts`
- 수정: `server/supabase/types.ts`
- 수정: `src/entities/job-posting/model.ts`
- 수정: `src/entities/job-posting/index.ts`
- 수정: `src/entities/job-posting/api.ts`
- 수정: `src/features/search-job-postings/ui/filter-form.tsx`
- 수정: `src/views/dashboard/index.tsx`
- 수정: `app/(app)/dashboard/page.tsx`
- 수정: `app/(app)/dashboard/analyses/[id]/page.tsx`

## 커밋

- `8304215` `[feat] 공고 마감일 타임스탬프 마이그레이션 추가`
- `265c31a` `[feat] 공고 경력 조건 타입과 마이그레이션 추가`
- `a350518` `[feat] 공고 마감일 KST 종료 시각 저장`
- `c51bd54` `[feat] 공고 경력 조건 자동 추출 연동`
- `034cbe6` `[feat] 공고 D-day 배지 판정 유틸 추가`
- `0562f96` `[feat] 공고 목록 필터와 페이지네이션 개편`

## 검증

- `cmd /c pnpm exec tsc --noEmit`: 통과
- `cmd /c pnpm lint`: 통과
- `cmd /c pnpm exec tsx server/jobs/verify-career-level.ts`: 통과
- `cmd /c pnpm build`: 통과

## 마이그레이션 / DB 검증

- 마이그레이션은 파일만 작성했고 실행하지 않았다.
- 실제 DB 검증은 사용자가 Supabase에 T1/T2 마이그레이션을 적용한 뒤 가능하다.
- KST 변환 기대값: 기존 `deadline='2026-10-07'`은 적용 후 `2026-10-07T14:59:59Z`가 되어야 한다.
- `onlyClosed=1`은 `deadline < now` 조건이라 `deadline is null` 상시 공고가 섞이지 않는다.
- `onlyClosed`가 `showClosed`보다 우선하도록 구현했다.

## 스펙 이탈 / 주의

- `src/shared/ui/tag`는 `main`에 존재하지 않아 새 shared primitive를 만들지 않고 `src/views/dashboard/index.tsx`의 inline badge 스타일로 처리했다. 리디자인 브랜치 병합 시 기존 Tag 컴포넌트가 들어오면 교체 가능하다.
- T5 API 변경과 T7 대시보드 호출부는 컴파일 경계가 맞물려 한 커밋(`0562f96`)에 함께 묶었다.
- `server/jobs/backfill-career-level.ts`는 dry-run/apply 모두 실행하지 않았다. 사용자가 직접 샘플 분포를 확인한 뒤 `--apply` 실행 여부를 결정해야 한다.
