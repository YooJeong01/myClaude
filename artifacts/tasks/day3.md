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

## T21. 기업분석 종합 로직 — `server/analysis/`

- [ ] `server/analysis/types.ts` — `company_analyses.result` JSON 스키마 확정. 초안:
  ```
  {
    overview:            string       // 회사 한 문단 개요
    financials_summary:  string       // DART 주요 재무 요약 (매출·영업익·순익 추세)
    recent_news_themes:  string[]     // 네이버 뉴스에서 뽑은 최근 이슈 테마
    analyst_view:        string       // 한경컨센서스 리포트 종합 (원문 인용 없이)
    risks:               string[]     // 리스크 요인
    talking_points:      string[]     // 지원동기 연결용 소재 (Day 4 매칭에서 사용)
  }
  ```
  `sources` 스키마: `{ dart: { year }, news: { link }[], consensus: { title, firm, url }[] }`
- [ ] `server/analysis/synthesize.ts` — `synthesizeCompanyAnalysis(inputs)` : 3개 소스 수집 결과 → 프롬프트 구성 → `server/llm` 의 `generateJson(prompt, resultSchema)` 호출 → 결과 검증. `sources` 는 LLM 이 아니라 수집 단계에서 코드로 조립
- [ ] 프롬프트 원칙: 원문(뉴스 본문·리포트 PDF) 재게시 금지, 출처 기반 요약, 한국어 리포트, talking_points 는 구체적으로
- [ ] 마이그레이션 불필요 — T3 `company_analyses` 테이블 재사용. `server/supabase/types.ts` 의 `company_analyses.result` 타입만 위 스키마로 구체화

## T22. 분석 Route Handler — `app/api/company/analyze/route.ts`

- [ ] `POST` — body `{ corp?: string, corp_code?: string, role?: string, job_posting_id?: string }`
- [ ] 흐름 (기존 `app/api/company/dart/route.ts` 패턴 계승):
  1. `requireUser()` → 401 (`UnauthorizedError`)
  2. `resolveCorp(admin, lookup)` → 404 (후보 목록 포함)
  3. `companies` lazy upsert — DART 기업개황으로 (corp_code unique)
  4. DART(`fetchCompanyProfile` + `fetchKeyFinancials`) · 네이버(`fetchCompanyNews`) · 한경컨센서스(`fetchRecentReports`) **병렬 수집** (`Promise.allSettled` — 일부 실패해도 나머지로 진행)
  5. `synthesizeCompanyAnalysis(...)`
  6. `company_analyses` insert — `user_id`, `company_id`, `role`, `result`, `sources`, `model`(`GEMINI_MODEL`)
  7. 저장된 분석 반환
- [ ] `export const runtime = "nodejs"`
- [ ] 에러 매핑: `DartApiError` / `HankyungScrapeError` / `LlmError`(rate limit 시 429) → 적절한 status

## T23. 스모크 / 검증 — `server/jobs/verify-analyze.ts`

- [ ] 인증 미구현(Day 8~9)이라 curl 불가 → `SCRAPE_OWNER_USER_ID` 유저 + `createAdminClient()` 로 전체 파이프라인 1회 실행 (예: 삼성전자, "프론트엔드 개발자")
- [ ] `result` JSON 6개 필드 채워졌는지, `sources` 에 실제 링크 들어갔는지 확인
- [ ] `company_analyses` 행 생성 확인, 같은 (user, company, role) 재실행 시 이력 누적(덮어쓰기 없음) 확인
- [ ] `tsc --noEmit` / `pnpm lint` / `pnpm build` 그린

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
