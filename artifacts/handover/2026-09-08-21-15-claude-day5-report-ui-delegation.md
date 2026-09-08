# Day 5~6 온디맨드 리포트 UI 위임 (Codex)

- 2026-09-08 21:15
- 위임자: claude / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/tasks/day5.md` (T28~T34)** — 이 문서가 요구사항의 정본이다.
  먼저 UTF-8 로 읽어라 (`Get-Content -LiteralPath ... -Encoding UTF8`, 기본 인코딩은 한글이 깨진다).
  `artifacts/tasks/day4.md` 규율 섹션, `AGENTS.md` 도 같은 방식으로 읽어라.

## 작업 범위

새 브랜치 **`feat/on-demand-report-ui`** 를 `main` 에서 만들어 작업한다. day5.md 의 T28~T34 를 **의존성 순서대로**:

**T28 → T29 → T30 → T31 → T32 → T33 → T34**

- **T28** 매직링크 로그인 최소 구현 — `src/features/auth/`, `app/login/page.tsx`, `app/auth/confirm/route.ts`,
  hero/dashboard 진입점 연결 (day5.md 28-1~28-3)
- **T29** 경험 CRUD — `src/entities/experience/` + `src/features/manage-experience/` +
  `app/(app)/dashboard/experiences/page.tsx` (day5.md 29-1~29-3)
- **T30** 기업분석 실행/결과 화면 — `src/entities/company-analysis/` + `src/features/run-analysis/` +
  `src/widgets/company-analysis-report/` + `app/(app)/dashboard/analyses/[id]/page.tsx` (day5.md 30-1~30-4)
- **T31** 지원동기 매칭 화면 — `src/entities/motivation-draft/` + `src/features/run-motivation/` +
  `src/widgets/motivation-result/` + 라우트 2개 (day5.md 31-1~31-4)
- **T32** 이력·신선도 UI — `src/widgets/analysis-history/` + "다시 분석하기" + 지원동기 이력 (day5.md 32-1~32-3)
- **T33** 오프라인 미러링 — `pnpm add idb`, `src/shared/lib/offline-mirror/` + `use-online.ts` +
  조회 경로에 폴백 얹기 (day5.md 33-1~33-3)
- **T34** E2E — `pnpm add -D @playwright/test`, `playwright.config.ts`, `e2e/`, `test:e2e` 스크립트,
  로그인 fixture, 6 시나리오 (day5.md 34-1~34-3) + **구조화된 테스트 리포트
  `artifacts/test-reports/day5-e2e.md` (day5.md 34-4 — 필수 산출물)**

## 레퍼런스 (이 패턴을 그대로 따를 것)

- `src/features/add-job-posting/` — server action(`lib/submit.server.ts`: `requireUser()` → 검증 → api →
  `revalidatePath`) + `ui/form.tsx`(`useActionState`) + `index.ts` 공개 export. T28·T29 액션/폼의 정본 패턴.
- `src/entities/job-posting/` — `model.ts`(타입 + `validate*`) + `api.ts`(SSR 클라이언트 인자, RLS 의존,
  `mapRow` camelCase 변환) + `index.ts`. T29·T30·T31 entity 의 정본 패턴.
- `src/entities/session/model.ts` — `getUser()` / `requireUser()` / `UnauthorizedError`. 세션은 이것만 쓴다.
- `src/shared/api/supabase/{client,server,middleware}.ts`, `src/shared/api-server` — 브라우저/SSR 클라이언트.
  `createSupabaseServerClient` 가 SSR(쿠키) 클라이언트.
- `src/views/dashboard/index.tsx` — 서버 컴포넌트 가드(`getUser()` → `redirect`) + 섹션 레이아웃. Tailwind 톤 맞출 것.
- `app/api/company/analyze/route.ts` (`POST { corp, role, job_posting_id? }`) /
  `app/api/motivation/route.ts` (`POST { company_analysis_id, experience_ids[], role? }`) —
  **이 라우트는 그대로 호출만 한다. 시그니처 변경 금지.**
- `server/analysis/types.ts` 의 `CompanyAnalysisResult`, `server/motivation/types.ts` 의 `MotivationResult` —
  결과 렌더 위젯이 이 타입을 그대로 쓴다. jsonb(`Json`) → 타입 캐스트는 insert/select 경계에서.
- `supabase/migrations/20260830155347_init.sql` — (이번엔 마이그레이션 없음, 참고만)
- `@supabase/ssr` 공식 문서의 서버사이드 매직링크 confirm 패턴 (`verifyOtp({ token_hash, type })`).

## 반드시 지킬 것

1. **커밋 규칙**: `feat/on-demand-report-ui` 브랜치, **태스크(T28…T34) 스텝별** `[feat]`/`[chore]` 한글 커밋.
   **`main` 병합·push 금지.** 브랜치만 남긴다.
2. **커밋 전 검증**: `pnpm exec tsc --noEmit`, `pnpm lint`(eslint + steiger — **FSD 경계 위반 0**), `pnpm build` 통과.
   각 태스크 커밋 시점에 최소 tsc + lint 는 그린이어야 한다.
3. **FSD 경계**: `entities → features → widgets → views → app` 단방향. `app/` 라우트는 얇게(뷰 렌더/가드만),
   로직은 `src/`. 슬라이스마다 `index.ts` 공개 API. `server/` 에 `next/*` import 금지.
4. **"내 데이터" 는 SSR 클라이언트 + RLS 로만.** 경험·분석·이력 조회/쓰기에 `createAdminClient()` 쓰지 말 것
   (admin 은 verify 스크립트·기존 analyze 라우트 한정). 세션은 `requireUser()` 이음새로만.
5. **보호 페이지는 `app/(app)/dashboard/...` 하위.** 미들웨어가 `startsWith("/dashboard")` 로 게이팅한다.
   `/login`·`/auth/*` 는 비보호 — 로그인 안 된 상태로 접근 가능해야 한다. 미들웨어 매처는 건드리지 말 것.
6. **새 패키지는 `idb`, `@playwright/test` 두 개만** (day5.md D9·D10 에서 승인). 그 외 추가 시 멈추고 물어라.
   `.env.example` 에 새 변수 필요하면(예: `NEXT_PUBLIC_SITE_URL`) 추가하고 done 노트에 명시.
7. **DB 스키마 변경 없음.** `user_experiences` / `motivation_drafts` 는 이미 `main` 에 마이그레이션 완료.
   `server/supabase/types.ts` 는 이미 두 테이블 타입이 있다 — 건드릴 일 없음. 빈 네임스페이스 shape 절대 손대지 말 것.
8. **API 라우트(`/api/company/analyze`, `/api/motivation`) 는 client `fetch` 로 호출**(server action 래핑 안 함,
   day5.md D7). 기업분석은 수십 초 걸리므로 로딩/에러 UX 필수. 429/404/candidates 분기 처리.
9. **Supabase URL Configuration(Redirect URLs) 등록은 사용자 몫.** Codex 는 코드만. done 노트에
   "사용자가 로컬 `http://localhost:3000` + Vercel 도메인을 Redirect URLs 에 등록해야 T28·T34 동작" 명시.
10. **T34 세션 주입**: 매직링크 메일을 기다리지 말고 `@supabase/supabase-js` admin 의
    `generateLink({ type: "magiclink", email })` → `token_hash` 로 `/auth/confirm` 진입하는 fixture 로.
    테스트 사용자·데이터는 기존 `SCRAPE_OWNER_USER_ID` + 기존 `company_analyses` 재사용(day5.md D11).
    E2E 가 만든 `user_experiences` 는 정리, `motivation_drafts` 는 남겨도 됨.
11. **애매하면 멈춘다**: day5.md 로 판단이 안 서는 설계 선택(auth confirm 흐름, 위젯 분해, 미러 스키마,
    playwright fixture 구조 등)이 나오면 억지로 정하지 말고 `artifacts/handover/` 에
    `<타임스탬프>-codex-day5-blocked.md` 로 상황·선택지 남기고 종료.

## 진행 중간 보고 (권장)

T28(로그인) 완료·커밋 후 `artifacts/handover/` 에 짧은 `<타임스탬프>-codex-day5-t28-done.md` 를 남기고
계속 진행해라 (로그인이 나머지 전부의 선행이라 여기서 한 번 상태를 남기는 게 좋다). 멈출 필요는 없다.

## 완료 시 보고

`artifacts/handover/` 에 `<타임스탬프>-codex-day5-done.md`:
- 생성/수정 파일 목록 (태스크별로 묶어서)
- 새 패키지·새 env 변수
- tsc / lint(steiger 포함) / build 결과
- `pnpm test:e2e` 결과 — 실패 시나리오가 있으면 원인(코드 문제인지 / Redirect URL 미등록 등 환경 문제인지)
- **`artifacts/test-reports/day5-e2e.md` 작성 완료 여부** (day5.md 34-4 항목 전부 채웠는지:
  환경/시나리오 expected·actual/성능 수치/통과율 N·M/발견 문제)
- 커밋 해시 목록 (태스크별)
- day5.md 스펙에서 벗어난 부분 + 이유
- 미해결/주의 사항
