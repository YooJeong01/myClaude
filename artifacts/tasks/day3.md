# Day 3 태스크 — 기업분석 종합 (DART + 뉴스 + 컨센서스 → LLM 종합 리포트)

- 작성: 2026-09-07 19:13 / LLM 제공자 확정: 2026-09-07 (Google Gemini 무료 티어)
- T19 는 완료, T20~T23 는 예정
- 선행: `day1.md`(T1~T7), `day2.md`(T8~T18 + 타입부채 정리)

## 목표

공고의 회사명 → **DART 재무 + 네이버 뉴스 + 한경컨센서스** 3개 소스를 **Google Gemini**(무료 티어)로 종합해
구조화된 기업분석 리포트를 만들고 `company_analyses` 에 이력 누적 저장한다.
goal.md 필수 기능인 **기업분석 → 지원동기 연결**의 앞단 (지원동기 매칭은 Day 4).

### LLM 제공자 결정 (2026-09-07)

- **Google Gemini API 무료 티어** 사용. 이유: Anthropic/OpenAI API 는 구독과 별도 유료이고, 사용자는 무료 티어를 원함.
  GitHub Models 는 2026-07-30 종료됨. 사용자가 구글 계정(`ujjh77@gmail.com`) 보유 → aistudio.google.com 에서 카드 없이 키 발급.
- 모델: **`gemini-3.6-flash`** (2026-09 기준. `gemini-2.5-flash` 는 신규 사용자에게 닫혀 API 가 3.x 로 안내함). 무료 한도 ≈ 10 RPM / 250 RPD — "다시 분석하기" 수동 버튼이라 충분.
- 구독(Claude Max)으로 하는 비동기 방식(GHA + `CLAUDE_CODE_OAUTH_TOKEN`)도 검토했으나 1~3분 지연 때문에 기각.

## 의존성 순서

**T19 → T20 → T21 → T22 → T23**

- T20(LLM 클라이언트)과 T21(종합 로직)은 T21 이 T20 을 쓰므로 순차
- T22(Route Handler)는 T21 완료 후, T23(스모크)은 T22 후

## T19. 한경컨센서스 수집 모듈 [완료]

- [완료] `server/hankyung/config.ts` — 베이스 URL, 목록 엔드포인트, 파라미터 상수, **리스크/이용범위 인지 주석** (전재·복사·대여 금지 고지, robots noindex 확인 → 목록 메타데이터만 수집·원문 URL 만 보존)
- [완료] `server/hankyung/types.ts` — `HankyungReport` (제목·증권사·종목명·종목코드·리포트종류·작성일·원문 URL·작성자), `FetchRecentReportsOptions`
- [완료] `server/hankyung/http.ts` — `hankyungGet()` : `server/scraping/common/http.ts` 의 `fetchWithRetry` 재사용
- [완료] `server/hankyung/client.ts` — `fetchRecentReports(opts)` : `consensus.hankyung.com/analysis/list` 정적 HTML 테이블 파싱, 종목명/키워드 필터
- [완료] `server/jobs/verify-hankyung.ts` — 스모크 (`.env.local` 불필요)
- [완료] 검증: 삼성전자 리포트 3건 조회 (제목·증권사·작성일·PDF URL). Codex 위임 구현 → 재검증(tsc/lint/build)
- [남음] 현재는 목록 첫 페이지 최대 80건만 조회. 더 깊은 과거 범위 필요 시 페이지네이션 정책 별도 결정

## T20. LLM 클라이언트 모듈 — `server/llm/` [완료 2026-09-07]

- [완료] `pnpm add @google/genai` (2.21.0)
- [완료] `.env.example` 에 `GEMINI_API_KEY` 추가. `.env.local` 은 사용자가 채움
- [완료] `server/llm/config.ts` — 모델 `gemini-3.6-flash`, `getGeminiApiKey()` (없으면 `LlmError("NO_API_KEY")`), `MAX_OUTPUT_TOKENS`/`TEMPERATURE` 상수
- [완료] `server/llm/errors.ts` — `LlmError` + `LlmErrorCode` (`NO_API_KEY`/`RATE_LIMITED`/`BAD_REQUEST`/`EMPTY_RESPONSE`/`INVALID_JSON`/`LLM_ERROR`)
- [완료] `server/llm/client.ts` — `@google/genai` 래퍼
  - `generateText({ prompt, systemInstruction? })` — 자유 텍스트 (스모크용)
  - `generateJson<T>({ prompt, schema, systemInstruction? })` — `responseMimeType: "application/json"` + `responseSchema` 로 구조 강제 → `JSON.parse`
  - `ApiError` → `LlmError` 매핑 (429 → `RATE_LIMITED`, 4xx → `BAD_REQUEST`, 그 외 → `LLM_ERROR`)
  - 클라이언트 인스턴스 모듈 캐시
- [완료] `server/jobs/verify-llm.ts` — 자유 텍스트 + JSON 스키마 강제 2케이스
- [완료] 검증: `tsc`/`lint`/`build` 그린. `verify-llm.ts` 실행 → "연결 정상" + 삼성전자 JSON(company/sector/keywords) 정상
- [발견] `gemini-2.5-flash` 는 신규 사용자에게 닫혀 404 → API 안내대로 `gemini-3.6-flash` 로 변경. `@google/genai` 는 `Interactions API` 권장 문구가 있으나 `models.generateContent` 로 동작

## T21. 기업분석 종합 로직 — `server/analysis/` [완료 2026-09-07]

확장 전제(사용자 지시): result 는 jsonb 라 컬럼 추가 자유, `schema_version` 으로 구 데이터 구분,
LLM 생성부와 코드 조립부 분리, 프롬프트는 별도 모듈로 교체 쉽게.

- [완료] `server/analysis/types.ts`
  - `CompanyAnalysisResult` (v1): `schema_version` + `overview` / `financials_summary` / `recent_news_themes[]` / `analyst_view` / `risks[]` / `talking_points[]`
  - `ANALYSIS_SCHEMA_VERSION = 1` — 필드 변경 시 올림
  - `companyAnalysisResultSchema: Schema` — Gemini responseSchema (인터페이스와 수동 동기화, 주석에 명시)
  - `AnalysisSources` (`dart` / `news[]` / `consensus[]`) — 코드로 조립, 프론트 "근거 보기"용
  - `SynthesisInput` — 소스 추가 시 필드만 늘림. 각 소스 "없을 수 있음" 표현
- [완료] `server/analysis/prompt.ts` — `SYNTHESIS_SYSTEM_INSTRUCTION` + `buildSynthesisPrompt()`. 섹션 포맷터 분리(재무/뉴스/리포트), 원문 재게시 금지·자료 기반·한국어·직무 반영
- [완료] `server/analysis/synthesize.ts` — `synthesizeCompanyAnalysis(input)` : 프롬프트 → `generateJson` → `schema_version` stamp + `buildSources()` (LLM 관여 없이 입력에서 조립) → `{ result, sources, model }`
- [완료] `server/jobs/verify-synthesize.ts` — DB/Route 없이 파이프라인만 스모크
- [완료] 마이그레이션 불필요 (T3 `company_analyses` 재사용). result 타입은 `server/analysis/types.ts` 가 소유, `company_analyses.result` 는 `Json` 유지하고 insert 경계에서 캐스트 (T22)
- [완료] 검증: tsc/lint/build 그린. `verify-synthesize.ts` 삼성전자 → 6필드 정상 채움, talking_points 가 "프론트엔드 개발자" 직무 반영, sources 뉴스 10·컨센서스 9건 조립

## T22. 분석 Route Handler — `app/api/company/analyze/route.ts` [완료 2026-09-07]

- [완료] `POST` — body `{ corp?, corp_code?, role, job_posting_id? }`. `role` 필수(400), `corp`/`corp_code` 중 하나 필수(400)
- [완료] 흐름 (dart route 패턴 계승): `requireUser()`(401) → `resolveCorp`(404, 후보 포함) →
  `collectCompanySources` (3개 소스 병렬, profile 필수·나머지 degrade) → `upsertCompany` →
  `synthesizeCompanyAnalysis` → `insertCompanyAnalysis`
- [완료] 얇게 유지 — 수집은 `server/analysis/collect.ts`, DB 는 `server/analysis/persist.ts` 로 분리 (T23 재사용)
- [완료] `export const runtime = "nodejs"`
- [완료] 에러 매핑: `DartApiError`(NO_DATA 404 / RATE_LIMITED 429 / 그 외 502) / `LlmError`(RATE_LIMITED 429 / NO_API_KEY 500 / 그 외 502) / `HankyungScrapeError` 502
- [완료] `pnpm build` → `ƒ /api/company/analyze` 라우트 등록 확인

## T23. 스모크 / 검증 — `server/jobs/verify-analyze.ts` [완료 2026-09-07]

- [완료] `SCRAPE_OWNER_USER_ID` 유저 + `createAdminClient()` 로 route 와 같은 순서 재현 (인자로 회사명·직무)
- [완료] 검증 실행:
  - 삼성전자 / 프론트엔드 개발자 → `company_analyses` 행 생성, result 6필드·talking_points 3·risks 3, sources dart+news12+consensus9
  - 카카오 / 백엔드 개발자 → 정상, sources consensus 5
  - `(user, company, role)` 누적 이력 카운트 확인 (덮어쓰기 없음)
- [완료] `tsc --noEmit` / `pnpm lint` / `pnpm build` 그린

---

## 미결 판단 (사용자)

- [완료] `GEMINI_API_KEY` 발급·기입 — Vercel 배포 시 프로젝트 환경변수에도 등록 필요 (Day 8~9)
- `companies` 채우기 정책: analyze 시 lazy upsert (현재 계획) vs 별도 sync 잡. 우선 lazy 로 가고 필요 시 전환
- 무료 티어 한도(≈250 RPD) 초과 시 대응: Groq/Cerebras 등으로 폴백 여부 — 우선순위 낮음, 초과가 실제로 나면 검토
- 종합 리포트 한국어 품질이 `gemini-3.6-flash` 로 충분한지 T23 결과 보고 판단 (부족하면 pro 티어로 상향, 무료 한도는 더 낮음)

## 규율 (day1.md 계승)

1. `server/` 에 `next/*` import 금지 — ESLint 가 자동 차단
2. Supabase Auth 중앙화 — `requireUser()` 이음새로만 세션 추출
3. 브랜치 `feat/<kebab>` → 태스크 스텝별 커밋 → `main` 병합 (`main` 직접 커밋 금지)
4. 커밋 전 검증: `tsc --noEmit` / `pnpm lint` / `pnpm build` + 해당 `verify-*.ts` 스모크
