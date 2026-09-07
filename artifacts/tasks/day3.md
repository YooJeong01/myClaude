# Day 3 태스크 — 기업분석 종합 (DART + 뉴스 + 컨센서스 → LLM 종합 리포트)

- 작성: 2026-09-07 19:13
- T19 는 완료, T20~T23 는 예정
- 선행: `day1.md`(T1~T7), `day2.md`(T8~T18 + 타입부채 정리)

## 목표

공고의 회사명 → **DART 재무 + 네이버 뉴스 + 한경컨센서스** 3개 소스를 `claude-opus-5` 로 종합해
구조화된 기업분석 리포트를 만들고 `company_analyses` 에 이력 누적 저장한다.
goal.md 필수 기능인 **기업분석 → 지원동기 연결**의 앞단 (지원동기 매칭은 Day 4).

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

## T20. LLM 클라이언트 모듈 — `server/llm/`

- [ ] `pnpm add @anthropic-ai/sdk`
- [ ] `.env.example` 에 `ANTHROPIC_API_KEY` 추가
- [ ] `server/llm/config.ts` — 모델 `claude-opus-5`, `ANTHROPIC_API_KEY` env 읽기 + 없을 때 명확한 에러, `max_tokens` / `effort` 상수
- [ ] `server/llm/client.ts` — `@anthropic-ai/sdk` 래퍼
  - `new Anthropic()` (env 에서 키 resolve)
  - 종합 호출은 긴 출력 가능 → `client.messages.stream(...)` + `.finalMessage()`, adaptive thinking (`thinking: { type: "adaptive" }`), `output_config: { effort: "high" }`
  - 응답 `content` 에서 `text` 블록만 추출하는 헬퍼
  - 에러를 도메인 타입(`LlmError` 등)으로 매핑 (`Anthropic.RateLimitError` / `BadRequestError` / `APIError`)
  - `server/` 규칙상 `next/*` import 금지 — SDK 는 무관하니 OK
- [ ] `server/jobs/verify-llm.ts` — 짧은 프롬프트 1회 왕복해서 키·연결 확인

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
- [ ] `server/analysis/synthesize.ts` — `synthesizeCompanyAnalysis(inputs)` : 3개 소스 수집 결과 → 프롬프트 구성 → `server/llm` 호출 → `result`/`sources` 파싱·검증(스키마 안 맞으면 에러)
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
  6. `company_analyses` insert — `user_id`, `company_id`, `role`, `result`, `sources`, `model`
  7. 저장된 분석 반환
- [ ] `export const runtime = "nodejs"`
- [ ] 에러 매핑: `DartApiError` / `HankyungScrapeError` / LLM 에러 → 적절한 status

## T23. 스모크 / 검증 — `server/jobs/verify-analyze.ts`

- [ ] 인증 미구현(Day 8~9)이라 curl 불가 → `SCRAPE_OWNER_USER_ID` 유저 + `createAdminClient()` 로 전체 파이프라인 1회 실행 (예: 삼성전자, "프론트엔드 개발자")
- [ ] `result` JSON 6개 필드 채워졌는지, `sources` 에 실제 링크 들어갔는지 확인
- [ ] `company_analyses` 행 생성 확인, 같은 (user, company, role) 재실행 시 이력 누적(덮어쓰기 없음) 확인
- [ ] `tsc --noEmit` / `pnpm lint` / `pnpm build` 그린

---

## 미결 판단 (사용자)

- **`ANTHROPIC_API_KEY` 발급** — T20 착수 전 필요. 발급 후 `.env.local` 에 기입
- `companies` 채우기 정책: analyze 시 lazy upsert (현재 계획) vs 별도 sync 잡. 우선 lazy 로 가고 필요 시 전환
- 프롬프트 캐싱 (같은 회사 재분석 시 소스 재사용) — 우선순위 낮음, T21 에서 구조만 열어둠
- 종합 리포트 품질이 opus-5 로 과한지 / sonnet-5 로 충분한지는 T23 결과 보고 재검토

## 규율 (day1.md 계승)

1. `server/` 에 `next/*` import 금지 — ESLint 가 자동 차단
2. Supabase Auth 중앙화 — `requireUser()` 이음새로만 세션 추출
3. 브랜치 `feat/<kebab>` → 태스크 스텝별 커밋 → `main` 병합 (`main` 직접 커밋 금지)
4. 커밋 전 검증: `tsc --noEmit` / `pnpm lint` / `pnpm build` + 해당 `verify-*.ts` 스모크
