# Day 7 스크래퍼 검증 리포트

- 작성: 2026-09-09
- 브랜치: `feat/day7`
- 범위: T48 검증

## 정적 검증

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| `pnpm exec tsc --noEmit` | 통과 | build와 병렬 실행 시 `.next/types` 충돌이 있었고, 순차 재실행에서 통과 |
| `pnpm lint` | 통과 | eslint + steiger |
| `pnpm exec tsx server/jobs/verify-role-filter.ts` | 통과 | 28/28 |
| `pnpm build` | 미완료 | sandbox에서는 `.next/trace` EPERM, 승인 경로 단독 실행은 3분 이상 무출력으로 종료되지 않아 중단 |

## 로컬 스크래퍼 실행

실행은 확인 목적이라 `SCRAPE_MAX_PAGES=1`로 제한했다.

| 사이트 | 명령 | 수집/필터 결과 | DB 저장 |
| --- | --- | --- | --- |
| 원티드 | `pnpm exec tsx --env-file=.env.local server/jobs/scrape-wanted.ts` | 1페이지 20건 중 9건 제외, 11건 통과 | 실패: `job_postings_source_check` 미실행 |
| 점핏 | `pnpm exec tsx --env-file=.env.local server/jobs/scrape-jumpit.ts` | 1페이지 16건 중 6건 제외, 10건 통과 | 실패: `job_postings_source_check` 미실행 |
| 지행 | `pnpm exec tsx --env-file=.env.local server/jobs/scrape-zighang.ts` | 1페이지 20건 중 16건 제외, 4건 통과 | 실패: `job_postings_source_check` 미실행 |

## 중복 제거 dry-run

| 항목 | 결과 |
| --- | ---: |
| 전체 공고 | 1151건 |
| 중복군 | 50개 |
| 삭제 후보 | 130건 |

마이그레이션은 파일만 작성했고 실행하지 않았다. 사용자 실행 후 `server/jobs/dedupe-postings.ts` dry-run 및 필요 시 `--delete`를 다시 확인해야 한다.
