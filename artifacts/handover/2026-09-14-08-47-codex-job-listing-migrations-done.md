# 공고 목록 마이그레이션 파일 작성 완료

- 2026-09-14 08:47
- 브랜치: `feat/job-listing-filters`
- 상태: T1/T2 마이그레이션 파일 작성 완료. Supabase 적용은 사용자 대기.

## 작성 파일

- `supabase/migrations/20260914090000_job_postings_deadline_timestamptz.sql`
- `supabase/migrations/20260914090100_job_postings_career_level.sql`

## 적용 대기

- `deadline`은 기존 `date` 값을 해당 날짜 `23:59:59 KST` 기준 `timestamptz`로 변환한다.
- `career_level`은 nullable `text` 컬럼이며 허용값은 `신입`, `경력`, `신입·경력`, `경력무관`이다.
- 마이그레이션은 파일만 작성했고 실행하지 않았다. 실제 DB 검증은 사용자가 Supabase에 적용한 뒤 가능하다.

## 검증

- `cmd /c pnpm exec tsc --noEmit`: 통과
- `cmd /c pnpm lint`: 통과
