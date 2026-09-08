# Day 4 태스크 — 지원동기 매칭 (기업분석 + 개인 경험 → 지원동기 소재)

- 작성: 2026-09-07 / 미결 사항 확정: 2026-09-07
- 선행: `day3.md`(T19~T23, 기업분석 종합 완료 — `company_analyses` 에 구조화된 리포트 저장됨)
- **이 프로젝트의 필수 기능** (goal.md: "기업분석→지원동기 연결 기능은 필수")

## 작업 방식

- **계획·설계·검증은 Claude, 구현은 Codex 위임.** 이 문서가 Codex 위임의 기준.
- Codex 위임 시: `feat/<kebab>` 브랜치, 태스크 스텝별 `[tag] 한글` 커밋, `main` 병합·push 금지,
  애매하면 멈추고 `artifacts/handover/` 에 노트. Claude 가 tsc/lint/build + verify 스크립트로 검증 후 병합.

## 목표

사용자가 고른 **기업분석 결과(`company_analyses` 행) + 개인 경험 여러 개** → Gemini → 그 회사 지원동기로
쓸 수 있는 **소재 초안**(기업분석 각도 ↔ 개인 경험 매칭)을 만들고 이력 저장한다.

**Day 4 는 백엔드만.** 마이그레이션 + `server/motivation` + 라우트 + 검증까지.
경험 입력 폼·대시보드 통합·매칭 결과 화면은 **Day 5~6 (온디맨드 리포트 UI)** 로 이동 —
지금 대시보드는 mock auth 위 임시 화면이라 여기 UI 붙이면 Day 5~6 / Day 8~9 에서 두 번 갈아엎게 됨.

## 의존성 순서

**T24 → T25 → T26 → T27**

## T24. 스키마 — `user_experiences` + `motivation_drafts` [완료 2026-09-08]

### 24-1. 마이그레이션 — `supabase/migrations/<타임스탬프>_day4_motivation.sql`
사용자가 Supabase 대시보드 SQL Editor 에서 실행. `20260830155347_init.sql` 의 패턴(RLS, moddatetime 트리거) 준수.

- **`user_experiences`** — 사용자 소유, 편집 가능
  - `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users(id) on delete cascade`
  - `title text not null`, `body text not null`
  - `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
  - RLS: `for all to authenticated using ((select auth.uid()) = user_id) with check (동일)` (job_postings_all_own 패턴)
  - `updated_at` moddatetime 트리거
  - 인덱스: `(user_id, created_at desc)`

- **`motivation_drafts`** — 사용자 소유, 불변 이력 (덮어쓰기 없음, `company_analyses` 패턴)
  - `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users(id) on delete cascade`
  - `company_analysis_id uuid not null references public.company_analyses(id) on delete restrict`
  - `job_posting_id uuid references public.job_postings(id) on delete set null`
  - `experience_ids uuid[] not null default '{}'` — 스냅샷(경험이 나중에 수정/삭제돼도 이력 유지)
  - `result jsonb not null`, `model text`, `created_at timestamptz not null default now()`
  - RLS: 본인 select + 본인 insert (update/delete 정책 없음 → 불변)
  - 인덱스: `(user_id, company_analysis_id, created_at desc)`

### 24-2. 타입 동기화 — `server/supabase/types.ts`
`user_experiences` / `motivation_drafts` 의 Row/Insert/Update + Relationships 를 수동 추가.
파일 상단 규칙 준수(generated 컬럼 없음, 기본값 컬럼은 Insert optional, 빈 네임스페이스 shape 건드리지 말 것).

### 24-3. 검증
- `server/jobs/verify-schema.ts` 에 케이스 추가: `user_experiences` insert 성공, `motivation_drafts` insert 성공,
  타 유저 `user_id` 로 위장 insert 거부(RLS), `motivation_drafts` update 시도 거부
- `pnpm exec tsx --env-file=.env.local server/jobs/verify-schema.ts` 통과

## T25. 지원동기 매칭 로직 — `server/motivation/` [완료 2026-09-08]

`server/analysis/` 구조를 그대로 따른다 (types / prompt / generate 분리, 확장 전제, `schema_version`).

### 25-1. `types.ts`
- `MOTIVATION_SCHEMA_VERSION = 1`
- `MotivationResult`:
  ```
  {
    schema_version: number
    angles: {
      point: string              // 기업분석에서 잡은 지원 각도 (talking_point 기반)
      matched_experience: string // 연결되는 개인 경험 (경험 title)
      connection: string         // 왜 이 경험이 이 각도와 실제로 맞닿는지 (근거 — 억지 연결 방지)
      draft_sentences: string[]  // 지원동기에 넣을 초안 문장 2~3개 (완성문 아님)
    }[]
    summary_paragraph: string    // 각도들을 엮은 "예시" 흐름 (제출용 아님, 조합 방법 보여주기용)
  }
  ```
- `motivationResultSchema: Schema` — Gemini responseSchema (위 인터페이스와 **수동 동기화**, 주석 명시)
- `MotivationInput` — `{ role: string; companyName: string; analysis: CompanyAnalysisResult; experiences: { title: string; body: string }[] }`
- `MotivationOutput` — `{ result: MotivationResult; model: string }`

### 25-2. `prompt.ts`
- `MOTIVATION_SYSTEM_INSTRUCTION` — "기업분석 결과와 지원자 경험만 근거로, 과장 없이, 한국어로.
  경험과 회사 특성을 억지로 엮지 말고 **실제로 맞닿는 지점만** 각도로 만든다. 맞닿는 각도가 적으면 적게 낸다."
- `buildMotivationPrompt(input)` — 기업분석 result(overview / talking_points / risks 등)를 섹션으로 펼치고,
  경험을 번호로 나열, role 반영

### 25-3. `generate.ts`
- `generateMotivation(input: MotivationInput): Promise<MotivationOutput>` —
  `server/llm/client.ts` 의 `generateJson<Omit<MotivationResult,"schema_version">>` 호출 →
  `schema_version` stamp → 반환. 모델은 `GEMINI_MODEL`

## T26. Route Handler — `app/api/motivation/route.ts` [완료 2026-09-08]

`app/api/company/analyze/route.ts` 패턴 계승.
- `POST` body `{ company_analysis_id: string, experience_ids: string[], role?: string }`
- 흐름:
  1. `requireUser()` → 401
  2. body 검증: `company_analysis_id` 필수, `experience_ids` 1개 이상 → 400
  3. **본인 소유 확인** — `company_analyses` 행을 **SSR 클라이언트(쿠키, RLS)** 로 조회 → 없으면 404
     (analyze route 는 admin 을 썼지만, 여기는 "내 분석/내 경험"을 읽는 것이므로 RLS 로 소유를 강제)
  4. `user_experiences` 를 `experience_ids` 로 조회(SSR, RLS) → 요청 개수와 다르면 400
  5. `role` 없으면 조회한 분석 행의 `role` 사용
  6. `generateMotivation({ role, companyName, analysis: row.result, experiences })`
  7. `motivation_drafts` insert — SSR 클라이언트로 (RLS insert 정책 `auth.uid() = user_id` 통과).
     `user_id`, `company_analysis_id`, `job_posting_id`(분석 행에서), `experience_ids`, `result`, `model`
  8. 저장된 draft 반환
- `export const runtime = "nodejs"`
- 에러 매핑: `LlmError`(RATE_LIMITED 429 / NO_API_KEY 500 / 그 외 502), 그 외 500
- 참고: `row.result` 는 jsonb(`Json`) 라 `CompanyAnalysisResult` 로 캐스트해서 넘긴다 (analyze route insert 경계와 대칭)

## T27. 스모크 — `server/jobs/verify-motivation.ts` [완료 2026-09-08]

- `SCRAPE_OWNER_USER_ID` + `createAdminClient()`
- 준비:
  - 기존 `company_analyses` 행 1개 조회 — 없으면 "verify-analyze.ts 를 먼저 실행하세요" 안내 후 종료
  - 임시 `user_experiences` 2~3개 insert (예: "React 성능 최적화 프로젝트", "사내 디자인시스템 구축")
- `generateMotivation` 호출 → `MotivationResult` 확인: `angles` 비어있지 않음, 각 angle 의 `connection`·`draft_sentences` 채워짐
- `motivation_drafts` insert 확인, 같은 `(user, company_analysis_id)` 이력 누적(카운트) 확인
- 정리: 테스트로 만든 임시 `user_experiences` 삭제 (motivation_drafts 는 이력이라 남겨도 됨 — 데모 데이터)
- `tsc --noEmit` / `pnpm lint` / `pnpm build` 그린

## 확정된 설계 결정 (2026-09-07)

- **D1 — `MotivationResult` 스키마**: 구조화된 `angles[]`(point / matched_experience / connection / draft_sentences)
  + `summary_paragraph`(예시). 완성 자소서 문단이 아니라 "소재" (goal.md). `schema_version` 으로 추후 조정.
- **D2 — 저장**: `motivation_drafts` 별도 테이블. 분석 1개 → 경험 조합별 매칭 여러 번 = 이력 누적.
- **D3 — UI 범위**: Day 4 는 백엔드만. 경험 입력 폼·대시보드·결과 화면은 Day 5~6 로 이동.

## 완료 (2026-09-08)

- `feat/motivation-matching` (Codex 구현) → `main` `--no-ff` 병합 (`499bcc9`).
- 병합 전 검증:
  - 사용자가 `20260907233000_day4_motivation.sql` 실행 (처음엔 다른 구문을 실행해 테이블 미생성 → 재실행으로 해결).
  - `verify-schema.ts` 통과. 단, `motivation_drafts` 불변성 단언이 "update 시 42501 에러"를 기대했으나
    RLS 는 정책 없는 update/delete 를 에러가 아니라 0행으로 조용히 필터링함 → "0행 + 행 불변" 확인으로
    교정하고 delete 케이스 추가 (`020586f`, Claude 직접 수정 — 검증 스크립트 교정이므로).
  - `verify-motivation.ts` 통과 — 카카오/백엔드 분석으로 `angles` 2개 생성, `motivation_drafts` 저장,
    이력 누적 확인 (Gemini 503 일시 오류 후 재시도 성공).
  - `tsc --noEmit` / `pnpm lint` / `pnpm build` 그린, `/api/motivation` 라우트 등록 확인.
- 스펙 이탈 1건(문제 없음): `company_analyses` 행에 회사명이 없어 라우트가 `companies.name` 을 별도 조회해
  `MotivationInput.companyName` 으로 전달.
- 다음: Day 5~6 (`day5.md`, T28~T34) — Codex 위임 예정.

## 규율

1. **구현은 Codex 위임, Claude 는 계획·검증**
2. `server/` 에 `next/*` import 금지 — ESLint 차단
3. "내 데이터" 읽기·쓰기는 SSR 클라이언트(RLS)로. `requireUser()` 이음새로만 세션 추출
4. 브랜치 `feat/<kebab>` → 태스크 스텝별 커밋 → `main` 병합 (`main` 직접 커밋 금지)
5. 커밋 전 검증: `tsc --noEmit` / `pnpm lint` / `pnpm build` + `verify-*.ts` 스모크
6. LLM 은 `server/llm` 재사용 (모델 `gemini-3.6-flash`), 새 제공자 추가 금지
