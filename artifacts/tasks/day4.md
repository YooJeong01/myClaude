# Day 4 태스크 — 지원동기 매칭 (기업분석 + 개인 경험 → 지원동기 소재)

- 작성: 2026-09-07
- 선행: `day3.md`(T19~T23, 기업분석 종합 완료 — `company_analyses` 에 구조화된 리포트 저장됨)
- **이 프로젝트의 필수 기능** (goal.md: "기업분석→지원동기 연결 기능은 필수")

## 작업 방식 (이번 세션부터)

- **계획·설계·검증은 Claude, 구현은 Codex 위임.** 이 문서(day4.md)가 Codex 위임의 기준이 된다.
- Codex 위임 시: `feat/<kebab>` 브랜치, 태스크 스텝별 `[tag] 한글` 커밋, `main` 병합·push 금지,
  애매하면 멈추고 `artifacts/handover/` 에 노트. Claude 가 결과를 tsc/lint/build + verify 스크립트로 검증 후 병합.

## 목표

사용자가 고른 **기업분석 결과(`company_analyses` 행) + 개인 경험 여러 개** → Gemini → 그 회사 지원동기로
바로 쓸 수 있는 **소재 초안**(기업분석 talking_point ↔ 개인 경험 매칭 각도)을 만들고 이력 저장한다.

UI 통합(리포트 화면에서 분석+지원동기 함께 보기, 경험 다중선택 UX)은 Day 5~6. Day 4 는
**개인 경험 저장 + 매칭 백엔드 + 최소 입력 UI**까지.

## 의존성 순서

**T24 → T25 → T26 → T27**

- T24(스키마·경험저장)가 T25(매칭 로직)·T26(라우트) 선행
- T27(검증)은 마지막

## T24. 개인 경험 저장 + 스키마

### 24-1. 마이그레이션 — `supabase/migrations/<타임스탬프>_day4_motivation.sql`
사용자가 Supabase 대시보드 SQL Editor 에서 실행. 두 테이블:

- `user_experiences` — 사용자 소유, 편집 가능
  - `id uuid pk`, `user_id uuid not null references auth.users on delete cascade`
  - `title text not null`, `body text not null` (경험 서술)
  - `created_at`, `updated_at timestamptz not null default now()`
  - RLS: `for all to authenticated using (auth.uid() = user_id) with check (...)` (job_postings 패턴)
  - `updated_at` moddatetime 트리거 (init.sql 참고)
- `motivation_drafts` — 사용자 소유, 불변 이력 (덮어쓰기 없음, `company_analyses` 패턴)
  - `id uuid pk`, `user_id uuid not null references auth.users on delete cascade`
  - `company_analysis_id uuid not null references public.company_analyses on delete restrict`
  - `job_posting_id uuid references public.job_postings on delete set null`
  - `experience_ids uuid[] not null default '{}'` (스냅샷 — 경험이 나중에 수정/삭제돼도 이력 유지)
  - `result jsonb not null`, `model text`, `created_at timestamptz not null default now()`
  - RLS: 본인 select + 본인 insert (update/delete 정책 없음)
  - 조회 인덱스: `(user_id, company_analysis_id, created_at desc)`

### 24-2. 타입 동기화 — `server/supabase/types.ts`
`user_experiences` / `motivation_drafts` Row/Insert/Update 를 수동 추가 (파일 상단 규칙 준수,
빈 네임스페이스 shape 건드리지 말 것).

### 24-3. 경험 엔티티 — `src/entities/experience/`
`src/entities/job-posting/` 패턴 그대로:
- `model.ts` — `Experience` 타입, `NewExperienceInput`, `validateNewExperience` (title·body 필수)
- `api.ts` — `listExperiences(supabase)`, `insertExperience(supabase, userId, input)`, `deleteExperience(supabase, id)` (RLS 가 user_id 필터)
- `index.ts` — 배럴

### 24-4. 경험 입력 피처 — `src/features/add-experience/`
`src/features/add-job-posting/` 패턴:
- `ui/form.tsx` — title + body(textarea) 입력 폼 (client)
- `lib/submit.server.ts` — 서버 액션, `insertExperience`
- `index.ts`

### 24-5. 대시보드 통합 — `src/views/dashboard/index.tsx`
"내 경험" 섹션 추가: 입력 폼 + 저장된 경험 목록(제목 + 본문 일부 + 삭제 버튼).

### 24-6. 검증
- `pnpm exec tsx --env-file=.env.local server/jobs/verify-schema.ts` 에 `user_experiences` / `motivation_drafts` 케이스 추가 (insert 성공 / 타 유저 행 차단)
- 로컬 `pnpm dev` → 대시보드에서 경험 입력 → Supabase 행 확인

## T25. 지원동기 매칭 로직 — `server/motivation/`

`server/analysis/` 구조를 그대로 따른다 (types / prompt / generate 분리, 확장 전제).

### 25-1. `types.ts`
- `MOTIVATION_SCHEMA_VERSION = 1`
- `MotivationResult` (초안 — 확장 가능):
  ```
  {
    schema_version: number
    angles: {
      point: string              // 기업분석에서 잡은 지원 각도 (talking_point 기반)
      matched_experience: string // 어떤 개인 경험과 연결되는지 (경험 title 참조)
      draft_sentences: string[]  // 지원동기에 바로 넣을 수 있는 초안 문장 2~3개
    }[]
    summary_paragraph: string    // 각도들을 묶은 지원동기 문단 초안
  }
  ```
- `motivationResultSchema: Schema` — Gemini responseSchema (인터페이스와 수동 동기화)
- `MotivationInput` — `{ role: string; analysis: CompanyAnalysisResult; companyName: string; experiences: { title: string; body: string }[] }`
- `MotivationOutput` — `{ result: MotivationResult; model: string }`

### 25-2. `prompt.ts`
- `MOTIVATION_SYSTEM_INSTRUCTION` — "기업분석 결과와 지원자 경험만 근거로, 과장 없이, 한국어로,
  경험과 회사 특성을 억지로 연결하지 말고 실제로 맞닿는 지점만 각도로 만든다"
- `buildMotivationPrompt(input)` — 기업분석 result 를 섹션으로 펼치고(overview/talking_points/risks 등),
  경험 목록을 번호로 나열, role 반영

### 25-3. `generate.ts`
- `generateMotivation(input: MotivationInput): Promise<MotivationOutput>` —
  `generateJson<Omit<MotivationResult,"schema_version">>` 호출 → `schema_version` stamp → 반환
- `server/llm/client.ts` 의 `generateJson` 재사용, 모델은 `GEMINI_MODEL`

## T26. Route Handler — `app/api/motivation/route.ts`

`app/api/company/analyze/route.ts` 패턴 계승.
- `POST` body `{ company_analysis_id: string, experience_ids: string[], role?: string }`
- 흐름:
  1. `requireUser()` → 401
  2. body 검증: `company_analysis_id` 필수, `experience_ids` 1개 이상 (400)
  3. **본인 소유 확인** — `company_analyses` 행을 SSR 클라이언트(쿠키, RLS 적용)로 조회 → 없으면 404
     (analyze route 는 admin 을 썼지만, 여기는 "내 분석/내 경험"을 읽는 것이므로 RLS 로 소유 강제)
  4. `user_experiences` 를 `experience_ids` 로 조회(RLS) → 요청 개수와 다르면 400
  5. `role` 없으면 조회한 분석 행의 `role` 사용
  6. `generateMotivation({ role, analysis: row.result, companyName, experiences })`
  7. `motivation_drafts` insert — `user_id`, `company_analysis_id`, `job_posting_id`(분석 행에서), `experience_ids`, `result`, `model`
     (RLS insert 정책이 `auth.uid() = user_id` 이므로 SSR 클라이언트로 insert 가능, 또는 admin + 명시적 user_id)
  8. 저장된 draft 반환
- `export const runtime = "nodejs"`
- 에러 매핑: `LlmError`(RATE_LIMITED 429 / NO_API_KEY 500 / 그 외 502), 그 외 500

## T27. 스모크 — `server/jobs/verify-motivation.ts`

- `SCRAPE_OWNER_USER_ID` + `createAdminClient()`
- 준비: 기존 `company_analyses` 행 1개 조회(없으면 `verify-analyze.ts` 먼저 돌리라고 안내),
  임시 `user_experiences` 2~3개 insert
- `generateMotivation` 호출 → `MotivationResult` 필드 확인 (`angles` 비어있지 않은지, `draft_sentences` 채워졌는지)
- `motivation_drafts` insert 확인, 같은 `(user, company_analysis_id)` 이력 누적 확인
- 정리: 테스트로 만든 임시 경험 삭제
- `tsc --noEmit` / `pnpm lint` / `pnpm build` 그린

## 미결 판단 (사용자)

- `MotivationResult` 스키마 형태 — 위 `angles` + `summary_paragraph` 초안대로 갈지, 아니면
  "완성된 지원동기 문단 하나"만 뽑을지 / "여러 버전"을 뽑을지. T27 결과 보고 조정 가능(schema_version 있음)
- `motivation_drafts` 를 별도 테이블로(현재 계획) vs `company_analyses` 에 붙이기 — 별도 테이블 권장(경험 조합마다 다른 결과)
- 경험 입력 UI 를 Day 4 에 포함(현재 계획) vs Day 5~6 리포트 UI 와 함께 — 경험이 있어야 매칭을 테스트하므로 Day 4 포함 권장
- 무료 티어 한도 — 분석 + 매칭으로 회사당 LLM 2회. 수동 버튼이라 여전히 여유

## 규율

1. **구현은 Codex 위임, Claude 는 계획·검증** (이번 세션 확정)
2. `server/` 에 `next/*` import 금지 — ESLint 차단
3. Supabase Auth 중앙화 — `requireUser()` 이음새로만 세션 추출. "내 데이터" 읽기는 SSR 클라이언트(RLS)로
4. 브랜치 `feat/<kebab>` → 태스크 스텝별 커밋 → `main` 병합 (`main` 직접 커밋 금지)
5. 커밋 전 검증: `tsc --noEmit` / `pnpm lint` / `pnpm build` + 해당 `verify-*.ts` 스모크
6. LLM 은 `server/llm` 재사용 (모델 `gemini-3.6-flash`), 새 제공자 추가 금지
