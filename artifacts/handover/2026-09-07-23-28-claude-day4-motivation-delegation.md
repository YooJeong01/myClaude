# Day 4 지원동기 매칭 위임 (Codex)

- 2026-09-07 23:28
- 위임자: claude / 실행자: codex (`codex exec`, 백그라운드)
- 스펙: **`artifacts/tasks/day4.md` (T24~T27)** — 이 문서가 요구사항의 정본이다. 먼저 UTF-8 로 읽어라
  (`Get-Content -LiteralPath ... -Encoding UTF8`, 기본 인코딩은 한글이 깨진다).

## 작업 범위

`feat/motivation-matching` 브랜치(이미 생성됨). day4.md 의 T24~T27 을 구현한다:

- **T24** `supabase/migrations/<타임스탬프>_day4_motivation.sql` (user_experiences + motivation_drafts) +
  `server/supabase/types.ts` 두 테이블 타입 동기화 + `server/jobs/verify-schema.ts` 케이스 추가
- **T25** `server/motivation/` — `types.ts` / `prompt.ts` / `generate.ts` (day4.md 25-1~25-3 그대로)
- **T26** `app/api/motivation/route.ts` (day4.md T26 흐름 그대로)
- **T27** `server/jobs/verify-motivation.ts`

## 레퍼런스 (이 패턴을 그대로 따를 것)

- `server/analysis/{types,prompt,synthesize}.ts` — T25 는 이 구조의 복제본이다 (schema_version, Gemini responseSchema, generateJson 재사용)
- `server/analysis/types.ts` 의 `companyAnalysisResultSchema` — Gemini `Schema` 작성법
- `server/llm/client.ts` 의 `generateJson<T>()` — 그대로 호출 (새 LLM 코드 만들지 말 것)
- `app/api/company/analyze/route.ts` — T26 라우트 패턴 (단, T26 은 admin 이 아니라 **SSR 클라이언트**로 내 데이터를 RLS 로 읽는다. day4.md T26-3~7 참고)
- `src/shared/api-server` 의 `createSupabaseServerClient` — SSR(쿠키) 클라이언트
- `supabase/migrations/20260830155347_init.sql` — RLS/트리거/인덱스 SQL 스타일
- `server/jobs/verify-analyze.ts` / `verify-synthesize.ts` — T27 스모크 스크립트 형식

## 반드시 지킬 것

1. **커밋 규칙**: `feat/motivation-matching` 브랜치, 태스크 스텝별 `[feat]`/`[chore]` 한글 커밋.
   **`main` 병합·push 금지.** 브랜치만 남긴다.
2. **커밋 전 검증**: `pnpm exec tsc --noEmit`, `pnpm lint`(eslint + steiger), `pnpm build` 통과.
3. **`server/` 에서 `next/*` import 금지** (ESLint 가 차단).
4. **DB 스키마 스타일**: `server/supabase/types.ts` 상단 규칙 — 빈 네임스페이스 shape(`{ [_ in never]: never }`) 절대 건드리지 말 것.
5. **마이그레이션은 파일만 작성.** Codex 가 실행할 수 없다. verify-schema / verify-motivation 은 사용자가
   마이그레이션을 실행한 뒤에나 통과한다 — 스크립트는 완성하되, DB 접속이 필요한 스모크 실행이 실패하면
   "마이그레이션 미실행" 때문인지 확인하고 그 사실을 done 노트에 적어라 (코드가 틀린 게 아님).
6. **환경변수**: `.env.local` 에 `GEMINI_API_KEY`, `SCRAPE_OWNER_USER_ID`, Supabase 키가 이미 있다.
   `.env.example` 에 새 변수 추가 없음 (day4 는 새 env 없음).
7. **LLM**: `server/llm` 재사용. 모델은 `GEMINI_MODEL`(`gemini-3.6-flash`). 새 제공자·새 SDK 금지.
8. **애매하면 멈춘다**: day4.md 로 판단이 안 서는 설계 선택(스키마 필드, RLS 정책 형태, 라우트 계약 등)이
   나오면 억지로 정하지 말고 `artifacts/handover/` 에 `<타임스탬프>-codex-day4-blocked.md` 로
   상황·선택지 남기고 종료.

## 완료 시 보고

`artifacts/handover/` 에 `<타임스탬프>-codex-day4-done.md`:
- 생성/수정 파일 목록
- 마이그레이션 파일 경로 (사용자가 실행해야 함 — SQL 요약)
- tsc/lint/build 결과
- verify-schema / verify-motivation 실행 결과 (마이그레이션 전이면 그 상태 명시)
- 커밋 해시 목록
- day4.md 스펙에서 벗어난 부분이 있으면 그 이유
- 미해결/주의 사항
