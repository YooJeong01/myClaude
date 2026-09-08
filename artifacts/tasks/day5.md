# Day 5~6 태스크 — 온디맨드 리포트 UI (경험 입력 + 기업분석/지원동기 화면 + 이력·오프라인)

- 작성: 2026-09-08
- 선행: `day4.md`(T24~T27, 지원동기 매칭 백엔드 — `feat/motivation-matching` 병합 + 마이그레이션 실행 완료 후 시작)
- goal.md 일정 5~6일차 "화면 통합(온디맨드 리포트 UI)"
- **이 프로젝트의 필수 기능**(goal.md: "기업분석→지원동기 연결")의 사용자 대면 완성 단계

## 작업 방식

- **계획·설계·검증은 Claude, 구현은 Codex 위임.** 이 문서가 Codex 위임의 기준.
- Codex 위임 시: `feat/on-demand-report-ui` 브랜치, 태스크 스텝별 `[tag] 한글` 커밋, `main` 병합·push 금지,
  애매하면 멈추고 `artifacts/handover/` 에 노트. Claude 가 tsc/lint/build + E2E 로 검증 후 병합.
- Codex 는 UTF-8 파일 읽을 때 `-Encoding UTF8` 명시(한글 깨짐 방지).

## 목표

지금까지 백엔드만 있던 두 기능(`POST /api/company/analyze`, `POST /api/motivation`)을 실제 화면에 붙인다.
사용자가 브라우저에서 **로그인 → 경험 등록 → 공고 선택 후 기업분석 실행 → 분석 결과 + 경험 골라 지원동기 매칭
→ 지난 이력 조회**까지 한 흐름으로 할 수 있게 한다. 연결이 끊겨도 이전에 본 분석/매칭 결과는 읽을 수 있다.

## 범위 결정 (2026-09-08, 사용자 확정)

- **D4 — 매직링크 로그인 최소 구현을 Day 5 로 당김 (T28).** Day 5~6 화면 전부가 로그인 사용자용이라
  브라우저 E2E 검증에 로그인 수단이 필요. 실제 인증(Google OAuth)·프로덕션 배포·RLS 하드닝은 Day 8~9 유지.
- **D5 — 오프라인 미러링(IndexedDB) 포함 (T33).** goal.md "오프라인 지원" 섹션 전체를 Day 5~6 안에서 처리.
  "완전 오프라인 우선 아님 — 우연히 끊겼을 때 기존 조회분만 읽기" 수준.
- 세부 확정(D9 `idb` 사용 / D10 `@playwright/test` 상주 / D11 기존 테스트 데이터 재사용)은
  아래 "확정된 설계 결정" 참고.

## 의존성 순서

**T28 → T29 → T30 → T31 → T32 → T33 → T34**

- T28(로그인)은 나머지 전부의 선행 — 이게 없으면 브라우저에서 아무 화면도 못 봄
- T29(경험)·T30(분석)은 서로 독립, 단 T31(지원동기)이 둘 다를 입력으로 받으므로 T31 전에 완료
- T32(이력)는 T30·T31 결과가 있어야 의미, T33(오프라인)은 T30~T32 화면에 얹는 레이어
- T34(검증)는 마지막

## 공통 규율

1. FSD 경계 준수 — `src/entities` → `src/features` → `src/widgets` → `src/views` → `app`.
   `app/` 라우트는 얇게(뷰 렌더만), 로직은 `src/` 로. steiger + boundaries ESLint 통과.
2. `src/features/add-job-posting`(server action + `requireUser()` + SSR 클라이언트 + `revalidatePath`)
   패턴을 그대로 계승. "내 데이터" 읽기·쓰기는 **SSR 클라이언트(RLS)** 로만.
3. 보호 페이지는 `app/(app)/dashboard/...` 하위에 둔다 — 미들웨어가 `startsWith("/dashboard")` 로 이미 게이팅.
   `/login`·`/auth/*` 는 비보호(로그인 안 된 상태에서 접근 가능해야 함).
4. 브랜치 `feat/on-demand-report-ui` → 스텝별 커밋 → `main` `--no-ff` 병합(`main` 직접 커밋 금지).
5. 커밋 전 검증: `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm build` 그린.
6. 새 npm 패키지는 최소화. 단 `idb`(IndexedDB 래퍼, T33)와 `@playwright/test`(E2E, T34)는 도입 확정.
7. 서버 API 는 이미 있는 `/api/company/analyze`·`/api/motivation` 를 **그대로 호출**. 라우트 시그니처 변경 금지
   (필요하면 멈추고 노트).

---

## T28. 매직링크 로그인 최소 구현

Supabase 이메일 매직링크(OTP)만. 비밀번호·소셜 없음. Day 8~9 에서 provider 추가할 수 있는 구조로.

### 28-1. `src/features/auth/`
- `src/features/auth/lib/sign-in.server.ts` — server action `requestMagicLink(email)`:
  브라우저 클라이언트가 아니라 **route handler 또는 server action 에서** `supabase.auth.signInWithOtp`
  (`emailRedirectTo` = `${origin}/auth/confirm`). 성공/실패 메시지 반환.
- `src/features/auth/lib/sign-out.server.ts` — server action `signOut()`: `supabase.auth.signOut()` → `redirect("/")`.
- `src/features/auth/ui/login-form.tsx` — 이메일 1개 입력 + "로그인 링크 받기" 버튼 + 상태 표시
  (`add-job-posting/ui/form.tsx` 의 `useActionState` 패턴 계승).
- `src/features/auth/index.ts` — 공개 export.

### 28-2. 라우트
- `app/login/page.tsx` — `LoginForm` 렌더(얇게). 이미 로그인 상태면 `/dashboard` 로 `redirect`.
- `app/auth/confirm/route.ts` — `GET`. `@supabase/ssr` 공식 패턴: 쿼리의 `token_hash` + `type` 를
  `supabase.auth.verifyOtp` 로 교환 → 성공 시 `/dashboard` 로 `redirect`, 실패 시 `/login?error=...`.
  (구형 `?code=` 링크가 오면 `exchangeCodeForSession` 도 처리하거나, Supabase 대시보드에서 링크 형식 확인)

### 28-3. 진입점 연결
- `src/views/hero/index.tsx` — "대시보드" 버튼을 로그인 상태에 따라: 로그인 시 `/dashboard`, 아니면 `/login`.
  (서버 컴포넌트에서 `getUser()` 로 분기)
- `src/views/dashboard/index.tsx` 헤더에 로그아웃 버튼(`signOut` server action) 추가.
- 미들웨어(`src/shared/api/supabase/middleware.ts`)는 그대로. `/login`·`/auth` 는 `/dashboard` 프리픽스가
  아니므로 자동 통과.

### 28-4. env / Supabase 설정 (사용자)
- Supabase 대시보드 > Authentication > URL Configuration 에 로컬(`http://localhost:3000`)
  + (나중에) Vercel 도메인 을 Redirect URLs 에 등록.
- 매직링크 이메일은 Supabase 기본 SMTP(개발용, 저용량)로 충분. 프로덕션 SMTP 는 Day 8~9.
- `.env.example` 에 필요 시 `NEXT_PUBLIC_SITE_URL` 추가(로컬은 비워도 `origin` 으로 대체 가능하면 생략).

## T29. 경험 관리 — `user_experiences` CRUD

`day4.md` T24 마이그레이션으로 생성된 `user_experiences`(id / user_id / title / body / created_at / updated_at,
RLS `user_experiences_all_own`) 대상.

### 29-1. `src/entities/experience/`
- `model.ts` — `Experience` 타입(camelCase 매핑), `NewExperienceInput { title; body }`,
  `validateExperienceInput()` (title·body 필수, 길이 상한). `job-posting/model.ts` 패턴 계승.
- `api.ts` — `listExperiences(supabase)`, `insertExperience(supabase, userId, input)`,
  `updateExperience(supabase, id, input)`, `deleteExperience(supabase, id)`.
  전부 SSR 클라이언트 인자로 받고 RLS 에 의존(별도 where 없음). `job-posting/api.ts` 패턴.
- `index.ts` — 공개 export.

### 29-2. `src/features/manage-experience/`
- `lib/actions.server.ts` — `createExperience` / `editExperience` / `removeExperience` server action.
  `requireUser()` → 검증 → api 호출 → `revalidatePath("/dashboard/experiences")` (+ 대시보드).
  `add-job-posting/lib/submit.server.ts` 패턴 그대로(`UnauthorizedError` 처리 포함).
- `ui/experience-form.tsx` — 추가/수정 겸용 폼(제목 + 본문 textarea).
- `ui/experience-list.tsx` — 목록 + 각 항목 수정/삭제. 삭제는 확인 후.
- `index.ts` — 공개 export.

### 29-3. 라우트 / 통합
- `app/(app)/dashboard/experiences/page.tsx` — `getUser()` 가드 + `ManageExperience` 위젯 렌더.
- `src/views/dashboard/index.tsx` — "내 경험 N개" 요약 카드 + `/dashboard/experiences` 링크 추가.

## T30. 기업분석 실행 / 결과 화면

기존 `POST /api/company/analyze`(body `{ corp, role, job_posting_id? }`, 응답 `{ resolved, candidates?, analysis }`)
호출. 분석은 LLM 때문에 수십 초 걸릴 수 있음 → 로딩 상태 필수.

### 30-1. `src/entities/company-analysis/`
- `model.ts` — `company_analyses` Row → `CompanyAnalysis`(camelCase). `result` 는
  `@server/analysis/types` 의 `CompanyAnalysisResult` 로 캐스트(insert 경계 대칭). `sources` 포함.
- `api.ts` — `listAnalysesForCompany(supabase, companyId)`,
  `listRecentAnalyses(supabase)`, `getAnalysis(supabase, id)`. SSR + RLS.
  (RLS: `company_analyses` 는 Day 3 마이그레이션에서 본인 select 정책 있음 — 확인 후 없으면 노트)

### 30-2. `src/features/run-analysis/`
- `ui/run-analysis-button.tsx` — 클라이언트 컴포넌트. 공고 하나를 받아
  `fetch("/api/company/analyze", { corp: companyNameRaw, role, job_posting_id })` →
  로딩(스피너 + "분석 중… 최대 1분") → 성공 시 결과 페이지로 이동 / 실패 시 에러 토스트.
  429(RATE_LIMITED)·candidates 다중일 때 안내 메시지 분기.
- `index.ts` — 공개 export.

### 30-3. `src/widgets/company-analysis-report/`
- `ui/report.tsx` — `CompanyAnalysisResult` 6필드 렌더:
  overview(문단) / financials_summary(문단) / recent_news_themes(리스트) / analyst_view(문단) /
  risks(리스트) / talking_points(리스트, "지원동기 매칭에 쓰임" 강조).
- `ui/sources.tsx` — "근거 보기" 접힘 영역: `sources`(dart / news[] / consensus[]) 링크 목록.
- `index.ts` — 공개 export.

### 30-4. 라우트
- `app/(app)/dashboard/analyses/[id]/page.tsx` — 가드 + `getAnalysis` + `CompanyAnalysisReport` +
  "이 분석으로 지원동기 만들기" 버튼(→ T31).
- `src/views/dashboard/index.tsx` 공고 목록 항목에 `RunAnalysisButton` + (있으면) 최근 분석 링크.

## T31. 지원동기 매칭 실행 / 결과 화면

기존 `POST /api/motivation`(body `{ company_analysis_id, experience_ids[], role? }`) 호출.
응답: 저장된 `motivation_drafts` 행(`result` = `MotivationResult`).

### 31-1. `src/entities/motivation-draft/`
- `model.ts` — `motivation_drafts` Row → `MotivationDraft`(camelCase). `result` 는
  `@server/motivation/types` 의 `MotivationResult` 로 캐스트.
- `api.ts` — `listDraftsForAnalysis(supabase, companyAnalysisId)`, `getDraft(supabase, id)`. SSR + RLS.

### 31-2. `src/features/run-motivation/`
- `ui/experience-picker.tsx` — 클라이언트. 내 경험 목록에서 다중 선택(체크박스).
- `ui/run-motivation-button.tsx` — 선택된 경험 + `company_analysis_id` + role 로
  `fetch("/api/motivation")` → 로딩 → 결과 페이지 이동 / 에러 분기(경험 미선택 400, 429 등).
- `index.ts` — 공개 export.

### 31-3. `src/widgets/motivation-result/`
- `ui/result.tsx` — `MotivationResult` 렌더:
  `angles[]` 각각을 카드로(point / matched_experience / connection / draft_sentences 목록) +
  `summary_paragraph`(예시 흐름, "제출용 완성문 아님" 명시). angles 가 비면 "맞닿는 각도를 찾지 못함" 안내.
- `index.ts` — 공개 export.

### 31-4. 라우트
- `app/(app)/dashboard/analyses/[id]/motivation/page.tsx` — 가드 + `ExperiencePicker` +
  `RunMotivationButton`(분석 결과 요약을 옆에 표시).
- `app/(app)/dashboard/drafts/[id]/page.tsx` — 저장된 draft 1개 렌더(`MotivationResult` 위젯 재사용).

## T32. 이력 · 신선도 UI

goal.md "오프라인 지원" 중 DB/UI 로 처리되는 부분(덮어쓰기 없는 이력은 이미 `company_analyses` /
`motivation_drafts` 불변 설계로 완료 — 여기선 조회 UI).

### 32-1. `src/widgets/analysis-history/`
- `ui/history-list.tsx` — 특정 회사(companyId)의 지난 분석 목록. 각 항목: 생성일 + "N일 전" 배지 +
  결과 열기 링크. 최신이 위.
- `ui/freshness-badge.tsx` — `created_at` 기준 "오늘 / N일 전 / N주 전" 텍스트만. 낡음 판단은 사용자 몫
  (goal.md: "신선도는 '며칠 지났다'만 표시").
- `lib/relative-date.ts` — 순수 함수(`Intl.RelativeTimeFormat` ko). 테스트 쉬운 형태로.

### 32-2. "다시 분석하기"
- 분석 결과 페이지 상단에 `RunAnalysisButton` 재사용(같은 회사/직무로 새 분석 → 새 이력 행).
- `navigator.onLine === false` 면 버튼 비활성 + "오프라인에서는 새로 분석할 수 없습니다" (T33 과 연동).

### 32-3. 지원동기 이력
- `app/(app)/dashboard/analyses/[id]/motivation/page.tsx` 하단에 `listDraftsForAnalysis` 결과 목록
  (경험 조합/생성일). 같은 분석에 매칭을 여러 번 돌린 이력이 쌓임(D2 설계).

## T33. 오프라인 미러링 (IndexedDB)

"완전 오프라인 우선 아님. 우연히 연결이 끊긴 경우 **기존에 조회한** 분석/지원동기 결과를 볼 수 있는 정도"
(goal.md). 쓰기(새 분석/매칭)는 온라인에서만.

### 33-1. `src/shared/lib/offline-mirror/`
- `pnpm add idb` (≈1KB, Promise 기반 IndexedDB 래퍼).
- `db.ts` — `idb` 의 `openDB` 로 DB 1개, object store 2개:
  `company_analyses`(key = id), `motivation_drafts`(key = id). 값은 화면 렌더에 필요한 최소 필드.
- `mirror.ts` — `putAnalysis(row)` / `getAnalysis(id)` / `putDraft(row)` / `getDraft(id)` /
  `listMirroredAnalyses()`. SSR 로 서버에서 읽어 화면에 뿌린 직후 클라이언트에서 미러에 저장.
- 클라이언트 전용(`"use client"` 경계에서만). SSR 번들에 안 들어가게.

### 33-2. 조회 경로에 얹기
- 분석/지원동기 결과 페이지: 서버에서 못 읽었거나(fetch 실패) `navigator.onLine === false` 면
  미러에서 읽어 "오프라인 · 마지막으로 본 데이터" 배너와 함께 읽기 전용 렌더.
- 온라인으로 정상 로드되면 항상 최신으로 미러 갱신.

### 33-3. `src/shared/lib/use-online.ts`
- `online`/`offline` 이벤트 구독 훅. "다시 분석하기"·"지원동기 만들기" 버튼 비활성 제어에 사용.

## T34. 검증

### 34-1. E2E — `@playwright/test` 리포지토리 상주 (첫 테스트 인프라)
- `pnpm add -D @playwright/test` + `pnpm exec playwright install chromium`.
- `playwright.config.ts` — `webServer` 로 `pnpm dev`(또는 `pnpm build && pnpm start`) 자동 기동,
  `baseURL` 로컬. `.env.local` 사용(`SCRAPE_OWNER_USER_ID`, service role).
- `e2e/` 디렉터리. `package.json` 에 `"test:e2e": "playwright test"` 스크립트 추가.
- 세션 주입: 매직링크 메일을 기다리지 않고 `@supabase/supabase-js` admin 으로
  `admin.generateLink({ type: "magiclink", email })` → 반환된 `token_hash` 로 `/auth/confirm` 진입,
  또는 `admin.createSession`(가능 시). fixture 로 로그인된 컨텍스트 제공.
- 테스트 사용자: **기존 `SCRAPE_OWNER_USER_ID` 계정 재사용** (아래 34-3).
- 시나리오:
  1. 로그인 fixture → `/dashboard` 진입 확인
  2. `/dashboard/experiences` 에서 경험 2개 추가 → 목록 반영
  3. 공고에서 "기업분석" 실행 → 결과 페이지 6필드 렌더 (기존 분석 데이터 재사용, 아래)
  4. "지원동기 만들기" → 경험 2개 선택 → 실행 → `angles[]` 카드 렌더
  5. 같은 분석에서 매칭 한 번 더 → 이력 2건
  6. `context.setOffline(true)` → 방금 본 분석 페이지 새로고침 → 미러에서 읽어 "오프라인" 배너 +
     "다시 분석하기" 비활성

### 34-2. 정적 검증
- `pnpm exec tsc --noEmit` / `pnpm lint`(eslint + steiger) / `pnpm build` 그린
- FSD 경계 위반 0

### 34-3. 테스트 데이터
- 기존 `company_analyses` 행(`SCRAPE_OWNER_USER_ID` 소유, 삼성전자·카카오)을 그대로 재사용.
  LLM 을 매번 호출하지 않도록 기업분석 실행 시나리오는 기존 회사/직무로.
- E2E 가 만드는 `user_experiences` 는 각 테스트 끝에 정리. `motivation_drafts` 는 이력이라 남겨도 됨(데모).

### 34-4. 테스트 리포트 문서 (필수 산출물)

E2E 실행 결과를 **구조화된 리포트**로 남긴다. 위치: `artifacts/test-reports/day5-e2e.md` (새 폴더 생성).
"통과/실패"만 적지 말 것. 포함 항목:

- **테스트 상황/환경**: 실행 일시, OS, Node 버전, 브라우저(chromium 버전), 대상 커밋 해시, 실행 명령
- **시나리오별 표** (위 34-1 의 6개 각각):
  - 목적 / 사전조건 / 단계 / **예측 결과(expected)** / **실제 결과(actual)** / 통과·실패
- **성능 수치화**: 시나리오별 소요 시간(ms), 기업분석·지원동기 API 응답 시간(LLM 호출 구간 별도 표기),
  주요 페이지 첫 로드 시간
- **케이스 통과율**: 통과 N / 전체 M, 실패 케이스 목록
- **발견된 문제**: 원인, 해결 여부 — **코드 문제인지 환경 문제(Redirect URL 미등록 등)인지 구분**

(프로젝트 목표가 "AI 협업 중 문제 포착·해결 과정 기록"이라 테스트 리포트도 그 일부다 — goal.md / AGENTS.md.)

## 확정된 설계 결정 (2026-09-08)

- **D4** 매직링크(OTP) 로그인만 Day 5 로. 소셜/비번은 Day 8~9. `src/features/auth/` 에 격리해 나중에 확장.
- **D5** 오프라인은 IndexedDB 미러(읽기 전용 폴백)까지. 쓰기 큐/동기화는 범위 밖.
- **D6** 보호 라우트는 `/dashboard/*` 하위로 통일 — 미들웨어 매처 변경 없이 커버.
- **D7** 실행 UI 는 기존 API 라우트를 client `fetch` 로 호출(server action 래핑 안 함) — 로딩/에러 UX 단순.
- **D8** 결과·경험·이력 조회는 전부 SSR 클라이언트 + RLS. admin 클라이언트는 UI 경로에서 쓰지 않음.
- **D9** (2026-09-08 확정) 오프라인 미러는 `idb` 패키지 사용(직접 래퍼 작성 안 함).
- **D10** (2026-09-08 확정) E2E 는 `@playwright/test` 를 리포지토리에 상주시킨다 — 이 프로젝트 첫 테스트 인프라.
- **D11** (2026-09-08 확정) E2E·화면 확인은 기존 `company_analyses` 테스트 데이터 + `SCRAPE_OWNER_USER_ID`
  계정을 재사용한다(새 계정·새 분석 만들지 않음).

## 미결 판단 (사용자)

- 매직링크 이메일 발송: Supabase 기본 SMTP(개발 저용량 한도)로 Day 5~6 진행 → 프로덕션 SMTP 는 Day 8~9.
- Supabase Redirect URLs(로컬 `http://localhost:3000`, Vercel 도메인) 등록 — **사용자가 대시보드에서 설정** (진행 중).

## 규율 (day4.md 계승)

1. **구현은 Codex 위임, Claude 는 계획·검증**
2. `server/` 에 `next/*` import 금지 — ESLint 차단 (이번엔 주로 `src/`·`app/` 작업이라 해당 적음)
3. "내 데이터" 읽기·쓰기는 SSR 클라이언트(RLS)로. `requireUser()` 이음새로만 세션 추출
4. 브랜치 `feat/on-demand-report-ui` → 스텝별 커밋 → `main` `--no-ff` 병합 (`main` 직접 커밋 금지)
5. 커밋 전 검증: `tsc --noEmit` / `pnpm lint` / `pnpm build` + T34 E2E
6. 기존 API 라우트(`/api/company/analyze`, `/api/motivation`) 시그니처 변경 금지
