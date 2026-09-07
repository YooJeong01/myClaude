# Day 2 태스크 — 채용공고 자동수집 (스크래핑 + 이메일 파싱 + GitHub Actions)

- 소급 작성: 2026-09-07 19:13 (작업 자체는 2026-09-05~09-07 진행, 전부 완료)
- 원래 이 태스크 문서 없이 `artifacts/handover/` 에만 기록돼 있던 것을 `day1.md` 형식으로 정리한 것

## 의존성 순서

**T8 → T9 → T10 → (T11 ∥ T12 ∥ T13 ∥ T14 ∥ T15) → T16 → T17 → T18**

- T11~T15는 T10(공통 모듈) 후 서로 독립적으로 병렬 진행
- T17은 T13(캐치)의 후속 재작업, T18은 전체 재검증

## T8. 환경변수 정비 [완료]

- [완료] `.gitignore` 버그 수정 — `!.env.example` 예외 추가 (`.env*` 규칙에 재차단돼 있던 것)
- [완료] `.env.example` 전체 재작성 — DART / Supabase(URL·anon·service-role) / `SCRAPE_OWNER_USER_ID` / `SCRAPE_SEARCH_KEYWORDS` / Gmail(client id·secret·redirect·refresh_token) / Naver(client id·secret)

## T9. DB 마이그레이션 — job_postings source 확장 [완료]

- [완료] `supabase/migrations/20260905130000_job_postings_scrape_sources.sql` 작성
  - `job_postings_source_check` 확장: `'manual' / 'email'` → `+ 'scrape_saramin' / 'scrape_jobkorea' / 'scrape_catch'`
- [완료] `server/jobs/verify-schema.ts` 검증 케이스 추가 (scrape source insert 성공 / invalid source 거부)
- [완료] 사용자가 Supabase 대시보드 SQL Editor 에서 실행

## T10. 공통 스크래핑 모듈 [완료]

- [완료] `server/job-postings/types.ts` — `CollectedJobPosting`, `JobPostingSource`, `EmploymentType`
- [완료] `server/job-postings/persist.ts` — `insertCollectedJobPostings()` : `BATCH_SIZE` 배치 upsert, `ignoreDuplicates` 로 중복 실행 안전
- [완료] `server/scraping/common/types.ts` — `ScrapeError` 클래스 + `FetchRetryOptions`
- [완료] `server/scraping/common/http.ts` — `fetchWithRetry()` : 429/5xx 지수백오프 재시도, 15초 타임아웃
- [완료] `server/scraping/common/rate-limit.ts` — `sleep()`, 사이트별 `MIN_DELAY_MS` (saramin 2s / jobkorea 3s / catch 3s)
- [완료] `server/scraping/common/user-agent.ts` — `SCRAPER_USER_AGENT` (식별 가능한 봇 UA)
- [완료] `server/scraping/common/browser.ts` — `launchBrowser()`, `withPage()` Playwright 래퍼
- [완료] 패키지 설치 — `cheerio`, `playwright`, `googleapis` (devDependencies)

## T11. 사람인 스크래퍼 [완료]

- [완료] `server/scraping/saramin/{config,parser,client}.ts` — 사람인은 SSR 이라 cheerio 로 정적 HTML 파싱
- [완료] `server/jobs/scrape-saramin.ts` — CLI 잡
- [완료] 검증: 240건 수집 / 20건 신규 삽입 (220건 중복 스킵)
- [남음] 날짜 파싱 경고 (`"09/30(수)\n입사지원"` 형태) 다수 — 저장 자체는 됨, 파서 개선 여지 (우선순위 낮음)

## T12. 잡코리아 스크래퍼 [완료]

- [완료] `server/scraping/jobkorea/{config,client}.ts` — CSR 페이지라 Playwright 렌더링
- [완료] `server/jobs/scrape-jobkorea.ts` — CLI 잡
- [완료] 버그 수정: `browser.createBrowserContext is not a function` → `browser.newPage()` 직접 호출로 단순화
- [완료] 검증: 36건 수집 / 29건 신규 삽입

## T13. 캐치 스크래퍼 [완료]

- [완료] `server/scraping/catch/{config,client}.ts` — 최초엔 Playwright(Nuxt CSR) DOM 파싱
- [완료] `server/jobs/scrape-catch.ts` — CLI 잡
- [완료] 최초 구현은 0건 수집 → **T17 에서 JSON API 직접 호출로 재작성해 해결**

## T14. Gmail 이메일 파싱 (백업 채널) [완료]

- [완료] `server/gmail/{config,auth,client,parse}.ts` — OAuth2 (`google.auth.OAuth2`), 알림메일 목록/본문/읽음처리, 발신자별 파서
- [완료] `server/jobs/gmail-authorize.ts` — 1회성 인가 스크립트 (refresh_token 획득)
- [완료] `server/jobs/collect-email-postings.ts` — 읽지 않은 알림메일 → 파싱 → `insertCollectedJobPostings`
- [주의] refresh_token 이 Google Testing 모드라 7일마다 수동 갱신 필요

## T15. 네이버 뉴스 검색 API (기업분석 입력용) [완료]

- [완료] `server/naver/{config,http,types,client}.ts` — `fetchCompanyNews(회사명)` : 최신 뉴스 조회, HTML 엔티티 디코딩
- [완료] `server/jobs/verify-naver.ts` — 테스트 스크립트
- [완료] T18 에서 NAVER API HUB 로 이관 (아래 참고)

## T16. GitHub Actions 워크플로 [완료]

- [완료] `.github/workflows/scrape-postings.yml` — 사람인/잡코리아/캐치 3개 job, 하루 2회 (`0 0,12 * * *`) + `workflow_dispatch`
- [완료] `.github/workflows/collect-email.yml` — Gmail 수집 스케줄

## T17. 캐치 스크래퍼 JSON API 재작성 [완료]

- [완료] 캐치 채용 리스트가 CSR(Nuxt) JSON API (`/api/v1.0/recruit/information/getRecruitList`) 에서 로드됨을 발견
- [완료] `server/scraping/catch/client.ts` 완전 재작성 — Playwright/cheerio 제거, 순수 HTTP + `parseCatchRecruitResponse()`
- [완료] `.github/workflows/scrape-postings.yml` 의 `pnpm exec tsx` 호출에서 `--env-file=.env.local` 제거 (CI 엔 `.env.local` 없음, env 는 Secrets)
- [완료] `.gitignore` 정책 전환 — `artifacts/`, `handover/` 커밋되도록 (인수인계 문서 추적)

## T18. Day 2 재검증 — 스크래퍼 3종 / GHA E2E / 네이버 [완료]

- [완료] 스크래퍼 실전 수집·저장: 사람인 240 / 20신규, 잡코리아 36 / 29신규, 캐치 283 / 193신규 (JSON API 전환 실전 검증)
- [완료] GHA E2E: Secrets 4개 등록(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SCRAPE_OWNER_USER_ID`, `SCRAPE_SEARCH_KEYWORDS`) → `workflow_dispatch` → 3개 job 전부 success
  - 수정: `pnpm/action-setup` 의 `version: 9` 입력이 `package.json` `packageManager: "pnpm@9.15.4"` 와 충돌 → 입력 제거
- [완료] 네이버 401 진단 → **2026-06-25 NAVER API HUB 출시로 뉴스 검색 API 이관됨** 확인
  - `server/naver/{config,http}.ts` 이관: `openapi.naver.com` → `naverapihub.apigw.ntruss.com`, `/v1/search/news.json` → `/search/v1/news`, `X-Naver-Client-Id/Secret` → `X-NCP-APIGW-API-KEY-ID/KEY`
- [완료] 부수 버그 수정
  - `src/shared/api/supabase/middleware.ts` — `getClaims()` 가 세션 없을 때 `{data: null}` 반환하는데 `data.claims` 로 바로 구조분해 → 비로그인 접속마다 TypeError. `data?.claims` 로 수정
  - `server/scraping/common/browser.ts` — catch 블록이 실제 에러 메시지를 버리고 `siteBlocked` 로 뭉갬 → 원본 에러 포함
  - `server/dart/corp-code-file.ts` — fast-xml-parser 가 `corp_code`/`stock_code` 를 숫자로 파싱해 앞자리 0 유실 → `parseTagValue: false` (T4 소급 수정)
- [완료] 로그인 UI 부재로 사용자가 Supabase 대시보드에서 실제 유저 1명 생성 → `handle_new_user` 트리거로 `profiles` 행 확인 → `SCRAPE_OWNER_USER_ID` 를 그 id 로 교체

---

## 부수 작업 — Day 2 병합 정리 [완료]

- [완료] **타입 부채 정리** (`fix/type-debt` 브랜치) — Day 2(T8~T18) 병합 과정에서 누적된 `tsc --noEmit` 에러 16건 해소
  - 깨진 import 경로 2건: `server/job-postings/persist.ts` (`@/shared/supabase/types` → `../supabase/types`), `server/jobs/collect-email-postings.ts` (`createGmailClient` 를 `../gmail/auth` 에서 import)
  - cheerio v1.x 는 `Element` 타입을 re-export 안 함 → `server/scraping/saramin/parser.ts` 에서 `$()` 반환 타입으로 추론
  - **supabase-js `{}` 추론 근본 해결** (T3 부터 이어진 마찰): `server/supabase/types.ts` 의 빈 네임스페이스(Views/Functions/Enums/CompositeTypes)를 `Record<string, never>` → `{ [_ in never]: never }`. `Record<string, never>` 는 인덱스 시그니처가 생겨 `from()` 이 View 오버로드로 매칭되고 select 반환이 `{}` 로 무너졌음. 이 shape 은 `supabase gen types typescript --project-id <id> --schema public` 출력과 동일 → 스키마 변경 시 그 명령으로 재생성
  - `server/dart/corp-codes.ts` 의 `as CorpRow[]` 캐스트 제거
- [완료] `tsc --noEmit` / `pnpm lint` (steiger 포함) / `pnpm build` 전부 그린

---

## 환경 / 인프라 변경 (다음 세션 참고)

- 로컬: `gh` CLI 설치 (`YooJeong01` 인증), Playwright Chromium 바이너리 설치
- GitHub 저장소(`YooJeong01/myClaude`): Actions Secrets 4개 등록
- `.env.local`: `NAVER_CLIENT_ID/SECRET` → NCP(API HUB) 키, `SCRAPE_OWNER_USER_ID` → 실제 유저 id
- `.claude/settings.json`: `Bash(codex exec:*)` / `Bash(codex e:*)` 권한 규칙 (Codex 위임 시 auto 분류기 차단 해소)
- Supabase: `dart_corp_codes` 118,810행 적재 (T4), 실제 유저 1명 생성

## 미해결 / 낮은 우선순위

- 사람인 날짜 파싱 경고 (`"09/30(수)\n입사지원"` 형태) — 저장은 됨, 파서 개선 여지
- GHA 정기 스케줄(`0 0,12 * * *`) 다음 실행에서 한 번 더 확인 권장
- Gmail refresh_token 7일 만료 (Testing 모드) — 프로덕션 전환 시 OAuth 앱 게시 필요
