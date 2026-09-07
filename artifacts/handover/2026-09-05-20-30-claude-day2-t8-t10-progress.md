# Day2 T8~T10 진행 상황

- 2026-09-05 pm8:30

## 완료한 작업

### T8 — 환경변수 정비
- `.gitignore` 버그 수정: `.env.example` 재차단 해제 (`!.env.example` 추가)
- `.env.example` 신규 작성: DART/Supabase/SCRAPE_OWNER_USER_ID/SCRAPE_SEARCH_KEYWORDS/Gmail/Naver 등 전체 환경변수 예시 문서화

### T9 — DB 마이그레이션
- `supabase/migrations/20260905130000_job_postings_scrape_sources.sql` 작성
  - `job_postings_source_check` 확장: `'manual'/'email'` → `'manual'/'email'/'scrape_saramin'/'scrape_jobkorea'/'scrape_catch'`
- `server/jobs/verify-schema.ts` 검증 케이스 추가
  - scrape_saramin source insert 성공 테스트
  - invalid_source insert 거부 테스트 (체크 제약 확인)
  - 섹션 번호 갱신 (5→6→7)

### T10 — 공통 모듈 구축
- `server/job-postings/types.ts`: CollectedJobPosting, JobPostingSource, EmploymentType 정의
- `server/job-postings/persist.ts`: insertCollectedJobPostings() — BATCH_SIZE 배치 upsert, ignoreDuplicates로 중복 처리
- `server/scraping/common/types.ts`: ScrapeError 클래스 + FetchRetryOptions
- `server/scraping/common/http.ts`: fetchWithRetry() — 429/5xx 지수백오프 재시도, 15초 타임아웃
- `server/scraping/common/rate-limit.ts`: sleep(), 사이트별 MIN_DELAY_MS (saramin:2s, jobkorea:3s, catch:3s)
- `server/scraping/common/user-agent.ts`: SCRAPER_USER_AGENT (식별 가능한 봇 UA)
- `server/scraping/common/browser.ts`: launchBrowser(), withPage() — Playwright 래퍼

## 대기 중

- **패키지 설치**: `npm install -D cheerio playwright googleapis` (사용자가 로컬에서 직접 실행 필요)
  - cheerio: 사람인 정적 HTML 파싱
  - playwright: 잡코리아/캐치 CSR 페이지 렌더링
  - googleapis: Gmail API OAuth

## 다음 세션 계획

### T11~T13 — 사이트별 스크래퍼
- `server/scraping/saramin/`: config.ts, parser.ts (cheerio), client.ts
- `server/scraping/jobkorea/`: config.ts, client.ts (Playwright)
- `server/scraping/catch/`: config.ts, client.ts (Playwright)
- `server/jobs/scrape-*.ts`: 각 사이트 스크래퍼 CLI 잡

### T14 — Gmail 이메일 파싱
- `server/gmail/`: config, auth, client, parse 모듈
- `server/jobs/gmail-authorize.ts`: 1회성 인가 스크립트
- `server/jobs/collect-email-postings.ts`: 이메일 수집 잡

### T15 — 네이버 뉴스 API
- `server/naver/`: config, http, types, client 모듈
- `server/jobs/verify-naver.ts`: 테스트 스크립트

### T16 — GitHub Actions 워크플로
- `.github/workflows/scrape-postings.yml` (하루 2회)
- `.github/workflows/collect-email.yml` (3시간마다)
- (선택) `.github/workflows/dart-corp-sync.yml` (주 1회)

### T17~T18 — 검증 및 배포
- 로컬 스모크 테스트
- GHA workflow_dispatch 테스트
- Supabase job_postings 행 확인

## 주의사항

- `.env.local`은 아직 없음 (사용자가 로컬 세팅 필요)
- `SCRAPE_OWNER_USER_ID`는 사용자가 처음 로그인했을 때 Supabase에 생성됨
  - 코드는 env var 없으면 명확한 에러 메시지 출력하도록 준비
- Gmail refresh_token은 Testing 모드라 7일마다 갱신 필요 (수동 유지보수)
- 사람인/캐치 스크래핑 리스크 조항 인지 문구를 `config.ts` 상단에 명시

## 변경된 파일 요약

- `.gitignore` — 수정
- `.env.example` — 신규 작성
- `supabase/migrations/20260905130000_job_postings_scrape_sources.sql` — 신규 작성
- `server/jobs/verify-schema.ts` — 수정 (source 값 검증 케이스 추가)
- `server/job-postings/types.ts` — 신규 작성
- `server/job-postings/persist.ts` — 신규 작성
- `server/scraping/common/{types,http,rate-limit,user-agent,browser}.ts` — 5개 신규 작성
