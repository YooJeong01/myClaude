# Day 7 위임 (Codex)

- 2026-09-09 07:00
- 위임자: claude / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/tasks/day7.md` (T42~T48)** — 정본. UTF-8 로 읽어라
  (`Get-Content -LiteralPath ... -Encoding UTF8`). `AGENTS.md`, `day6.md` 규율도.

## 상황

사용자가 자기 전 진행. 막혀도 전체 중단 말고 그 태스크만 blocked 노트 → 다음 태스크.
이 환경에서 `codex exec` 가 메모리 부족으로 자주 죽음 — 죽으면 커밋된 데까지 Claude 가 인계.

## 작업 순서

`feat/day7` 브랜치를 `main` 에서:

1. **T42** `supabase/migrations/<ts>_more_scrape_sources.sql` (source 제약에
   scrape_wanted/scrape_jumpit/scrape_zighang 추가, 파일만) + `server/job-postings/types.ts`
   (`JobPostingSource` 확장, `CollectedJobPosting.techStacks?: string[]` 추가)
2. **T43** `server/scraping/wanted/` (config + client) + `server/jobs/scrape-wanted.ts`.
   API: `www.wanted.co.kr/api/chaos/navigation/v1/results?job_group_id=518&job_sort=job.latest_order&years=-1&locations=all&limit=20&offset=N`
   (인증 불필요, JSON `data[]`: id/company.name/position/address). `scrape-catch.ts` 패턴 복제.
3. **T44** `server/scraping/jumpit/` + `server/jobs/scrape-jumpit.ts`.
   API: `jumpit-api.saramin.co.kr/api/positions?page=N&sort=relation`
   (JSON `result.positions[]`: id/title/companyName/jobCategory/techStacks/locations).
   `techStacks` 를 `CollectedJobPosting.techStacks` 로 채움.
4. **T45** `server/scraping/zighang/` — `zighang.com/recruitment` 는 Next.js 앱, 공개 API 미확인.
   **깔끔한 JSON 엔드포인트 15분 안에 못 찾으면 blocked 노트 + 스킵.** fragile 스크래퍼 만들지 말 것.
5. **T47** `role-filter.ts` `classifyRole(role, text?, techStacks?)` 로 확장 —
   techStacks 를 판정 텍스트에 합침. `filterRelevantPostings` 가 `posting.techStacks` 넘기도록.
   기존 호출부 하위호환. `verify-role-filter.ts` 케이스 추가.
6. **T46** `supabase/migrations/<ts>_dedup_normalization.sql` (파일만) —
   `company_key`/`role_norm` generated 컬럼 표현식 강화(day7.md 46-1 그대로: 법인격 토큰·공백·괄호구간 제거,
   **보수적으로**). 기존 행 재계산 시 중복 제약 위반 가능 → 마이그레이션 상단에 주의사항 + 중복정리 SQL.
   `server/jobs/dedupe-postings.ts` 리포트+`--delete` 스크립트.
7. **T48** 검증 — tsc/lint/build + verify-role-filter + (원티드·점핏 로컬 실행으로 수집 확인) +
   `artifacts/test-reports/day7-scrape.md`.

T43·T44·T45 는 서로 독립(파일 안 겹침) — 순차든 병렬이든.

## 레퍼런스

- `server/scraping/catch/{config,client}.ts` + `server/jobs/scrape-catch.ts` — **JSON API 스크래퍼의 정본 패턴**
- `server/scraping/common/http.ts` `fetchWithRetry`, `common/user-agent.ts`, `common/role-filter.ts` `filterRelevantPostings`
- `server/job-postings/{types,persist}.ts` `CollectedJobPosting` / `insertCollectedJobPostings`
- `supabase/migrations/20260905130000_job_postings_scrape_sources.sql` — source 제약 변경 패턴
- `supabase/migrations/20260830155347_init.sql` line 87~107 — `company_key`/`role_norm` generated 컬럼 + 유니크 제약
- `server/jobs/audit-postings.ts` — dedupe 스크립트 패턴

## 반드시

1. `feat/day7` 브랜치, 태스크별 한글 커밋. **main 병합·push 금지.**
2. 커밋 전 `pnpm exec tsc --noEmit` / `pnpm lint`(eslint + steiger).
3. `server/` 에 `next/*` import 금지. 새 npm 패키지 금지(`fetch` + 기존 유틸).
4. 마이그레이션(T42·T46)은 **파일만**. verify 가 "제약/컬럼 없음"으로 실패하면 마이그레이션 미실행 탓 — done 노트에 명시.
5. `server/supabase/types.ts` 빈 네임스페이스 shape 손대지 말 것.
6. `next-env.d.ts` 커밋 금지.
7. day7.md "확정된 설계 결정" D1~D6 준수. 없는 판단 필요하면 blocked 노트.

## 보고

- 태스크 커밋마다 `artifacts/handover/2026-09-09-codex-day7-progress.md` 에 한 줄 append.
- 완료/중단 시 `artifacts/handover/<ts>-codex-day7-done.md` (파일 목록, tsc/lint/build,
  로컬 스크랩 결과, 커밋 해시, blocked 태스크, 미결).

## Claude 후속 (아침)

- 사용자: `more_scrape_sources.sql` + `dedup_normalization.sql` 실행.
- Claude: 검증 → 스키마 무관 태스크(T43·T44·T45·T47) 먼저 병합, 마이그레이션 태스크는 실행 후 병합.
- 현재 DB: 스크랩 공고 ~1151건 (사람인 대량 + 캐치). day7 로 원티드·점핏 추가 + 중복 제거.
