# Day 6 위임 (Codex) — 야간 자율 세션

- 2026-09-09 00:05
- 위임자: claude / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/tasks/day6.md` (T35~T41)** — 정본. UTF-8 로 읽어라
  (`Get-Content -LiteralPath ... -Encoding UTF8`). `AGENTS.md`, `day5.md` 규율도 같이.

## 상황

사용자가 자는 동안 진행하는 야간 세션이다. **막혀도 전체를 멈추지 말고**, 막힌 태스크만
`artifacts/handover/2026-09-09-<hhmm>-codex-day6-blocked-T##.md` 로 남기고 **다음 우선순위로 넘어가라.**

## 작업 범위 — 우선순위 순서 (사용자 지정)

`feat/day6` 브랜치를 `main` 에서 만들어, day6.md 를 **이 순서로**:

1. **T38** URL 단건 파싱 — `server/job-postings/parse-url.ts` (3단계 폴백: 알려진소스→JSON-LD/OG→LLM),
   `app/api/job-posting/parse/route.ts`, `src/features/add-job-posting/ui/form.tsx` "URL로 채우기",
   `server/jobs/verify-parse-url.ts`
2. **T39** 관심 공고 북마크 — `supabase/migrations/<ts>_saved_postings.sql` (파일만),
   `server/supabase/types.ts` 동기화, `verify-schema.ts` 케이스, `src/entities/saved-posting/`,
   `src/features/toggle-saved-posting/`, 대시보드·분석페이지 통합
3. **T40** 캘린더 — `pnpm add react-big-calendar date-fns`, `app/(app)/dashboard/calendar/page.tsx`,
   `src/widgets/saved-calendar/` (월뷰, 게시일~마감일 막대, 상시채용=하루, 클릭 시 raw_text 발췌+링크)
4. **T36** 기업분석 모아보기 — `src/entities/company-analysis/api.ts` `listAnalysesGrouped`,
   `app/(app)/dashboard/analyses/page.tsx` (회사별 카드 + 검색 + 커서 페이지네이션)
5. **T35** 공고 검색 + 페이지네이션 — `listJobPostings(supabase, opts?)` 확장(q/필터/range/count/커서),
   `src/views/dashboard` + `src/features/search-job-postings/` (searchParams 기반)
6. **T37** 스크래핑 필터 — `server/scraping/common/role-filter.ts` `isRelevantRole`,
   각 스크래퍼 client 에 적용, `server/jobs/audit-postings.ts`(dry-run), `verify-role-filter.ts`
7. **T41** 기업 규모 — `server/analysis/company-size.ts` `estimateCompanySize`,
   `CompanyAnalysisResult.estimated_size` 추가 + `ANALYSIS_SCHEMA_VERSION` 1→2,
   `synthesize.ts` 에서 코드로 stamp, 배지 표시, `verify-company-size.ts`

## 레퍼런스 (그대로 따를 것)

- `src/features/add-job-posting/`, `src/entities/job-posting/` — server action + entity 패턴
- `src/features/manage-experience/`, `src/entities/experience/` (day5) — 최근 CRUD 패턴
- `src/features/run-analysis/ui/run-analysis-button.tsx` — client fetch + 로딩/에러 UX
- `server/scraping/common/http.ts` `fetchWithRetry`, `server/scraping/common/user-agent.ts`
- `server/scraping/{saramin,jobkorea,catch}/` — 스크래퍼 구조
- `server/job-postings/types.ts` `CollectedJobPosting`, `server/job-postings/persist.ts`
- `server/llm/client.ts` `generateJson<T>` — 새 LLM 코드 만들지 말 것
- `server/analysis/{types,synthesize}.ts` — `schema_version` stamp 패턴, `DartCompanyProfile`/`DartKeyFinancials`
- `supabase/migrations/20260907233000_day4_motivation.sql` — RLS/트리거/인덱스 스타일 (T39 마이그레이션)
- `server/jobs/verify-*.ts` — 스모크 스크립트 형식
- `e2e/day5-report.spec.ts` — Playwright 시나리오/리포트 생성 패턴 (T34 확장, LLM 안 쓰는 시나리오만)

## 반드시 지킬 것

1. `feat/day6` 브랜치, 태스크별 `[feat]`/`[chore]` 한글 커밋. **main 병합·push 금지.**
2. 커밋 전: `pnpm exec tsc --noEmit` / `pnpm lint`(eslint + steiger, FSD 위반 0) / `pnpm build`.
   각 태스크 커밋 시점에 최소 tsc + lint 그린.
3. FSD 경계 단방향, 슬라이스마다 `index.ts`. `server/` 에 `next/*` import 금지.
4. "내 데이터" 는 SSR 클라이언트 + RLS. `createAdminClient()` 는 verify 스크립트·기존 analyze 라우트에서만.
5. 보호 페이지는 `app/(app)/dashboard/...` 하위. 미들웨어 매처 건드리지 말 것.
6. 새 패키지는 **`react-big-calendar`, `date-fns` 만**(T40). 그 외는 blocked 노트 남기고 그 태스크만 스킵.
7. 기존 API 라우트 시그니처 변경 금지. `server/supabase/types.ts` 빈 네임스페이스 shape 손대지 말 것.
8. **T39 마이그레이션은 파일만.** 실행 불가. `verify-schema.ts` / 북마크 검증이 "테이블 없음"으로 실패하면
   코드 문제 아님 — done 노트에 "마이그레이션 미실행" 명시하고 계속 진행.
9. `next-env.d.ts` 커밋 금지 (`git checkout -- next-env.d.ts` 로 되돌리고 커밋).
10. **day6.md 의 "가정한 결정"을 그대로 따른다.** 거기 없는 설계 선택이 필요하면 그 태스크만 blocked 노트 → 다음 태스크.

## 진행 보고

- 각 태스크 커밋 직후 한 줄짜리 진행 로그를 `artifacts/handover/2026-09-09-codex-day6-progress.md` 에 append
  (파일 없으면 생성, 있으면 이어쓰기 — 이 파일만 예외적으로 append 허용).
- 전체 끝나거나 더 진행 불가하면 `artifacts/handover/<ts>-codex-day6-done.md`:
  태스크별 파일 목록 / 새 패키지·env / tsc·lint·build 결과 / verify·E2E 결과(마이그레이션 전이면 명시) /
  커밋 해시 / day6.md 이탈 + 이유 / blocked 태스크 목록 / 미해결.

## Claude 후속 (아침)

- 사용자: `saved_postings` 마이그레이션 실행 (T39).
- Claude: `feat/day6` 검증 — 스키마 무관 태스크(T38·T36·T35·T37·T41) 먼저 tsc/lint/build + verify + E2E →
  그린이면 `main` `--no-ff` 병합. T39·T40 은 마이그레이션 실행 후 검증 → 병합.
- day6.md 체크박스 갱신 + 가정한 결정들 사용자 확인.
