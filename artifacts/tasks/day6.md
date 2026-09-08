# Day 6 태스크 — 탐색·수집·북마크 개선 (T35~T41)

- 작성: 2026-09-09 (야간 자율 작업 세션)
- 선행: `day5.md` (T28~T34, 온디맨드 리포트 UI — `main` 병합 완료)
- 배경: 사용자가 Day 5~6 결과물을 직접 테스트한 뒤 낸 피드백 7건을 태스크화.

## 작업 방식

- **계획·설계·검증은 Claude, 구현은 Codex 위임.** 이 문서가 정본.
- Codex 위임: `feat/day6` 브랜치, **우선순위 순서대로** 태스크 스텝별 `[tag] 한글` 커밋,
  `main` 병합·push 금지. Claude 가 tsc/lint/build + E2E 로 검증 후 병합.
- Codex 는 UTF-8 로 파일 읽기 (`Get-Content -Encoding UTF8`).
- **이 세션은 야간 자율 작업**이라 사용자에게 물을 수 없다. 아래 "가정한 결정"을 따르고,
  판단이 안 서면 해당 태스크만 `artifacts/handover/<ts>-codex-day6-blocked-T##.md` 로 남기고
  **다음 우선순위 태스크로 넘어간다** (전체 중단 금지).

## 우선순위 (사용자 지정)

**T38(D) → T39(E) → T40(F) → T36(B) → T35(A) → T37(C) → T41(G)**

- 마이그레이션이 필요한 T39·T40 은 파일만 작성. 사용자가 아침에 실행 → Claude 가 검증 후 병합.
  나머지(T38·T36·T35·T37·T41)는 스키마 변경 없어 야간에 검증·병합 가능.
- T40(캘린더)은 T39(북마크 테이블)에 의존. T35·T36 은 서로 독립이나 둘 다 대시보드/공고목록 근처를 건드리므로 순차.

---

## T38. URL 단건 파싱 (수동 입력 보조) — 우선순위 1 [완료 2026-09-09]

수동 공고 입력 폼에서 URL 하나만 주면 회사명·직무·고용형태·게시일·마감일·본문을 뽑아 폼을 채운다.
**자동 저장 아님** — 폼 프리필 후 사용자가 확인·수정하고 저장.

### 38-1. `server/job-postings/parse-url.ts`
- `parseJobPostingUrl(url: string): Promise<ParsedJobPosting>` — `ParsedJobPosting` = `CollectedJobPosting`
  의 부분집합(`server/job-postings/types.ts`), 못 뽑은 필드는 `undefined`.
- 3단계 폴백:
  1. **알려진 소스** — URL 호스트가 saramin/jobkorea/catch 면 기존 상세 파서 재사용.
     (현재 `server/scraping/*/parser.ts` 는 목록 파서만 있음 → 상세 페이지 파서가 없으면
     그 소스는 2·3단계로 폴백. 상세 파서 신규 작성은 이번 범위 아님, 폴백으로 충분.)
  2. **구조화 메타데이터** — `fetchWithRetry`(`server/scraping/common/http.ts`)로 HTML 가져와
     `<script type="application/ld+json">` 의 schema.org `JobPosting`
     (`title`, `hiringOrganization.name`, `datePosted`, `validThrough`, `employmentType`, `description`)
     → 없으면 OpenGraph(`og:title`, `og:description`).
  3. **LLM 추출** — 위에서 부족하면 본문 텍스트(태그 제거, 앞 8000자)를 `server/llm` `generateJson` 으로
     `{ companyName, role, employmentType, postedAt, deadline, bodySummary }` 추출.
     프롬프트: "채용공고 텍스트에서 아래 필드만 추출. 불확실하면 null. 날짜는 YYYY-MM-DD."
- 타임아웃 10s, UA 설정(`server/scraping/common/user-agent.ts`), 리다이렉트 따라감.
- 에러: `ScrapeError` 재사용. LLM 실패는 무시하고 2단계까지 결과만 반환(부분 성공 허용).

### 38-2. `app/api/job-posting/parse/route.ts`
- `POST { url }` → `requireUser()`(401) → URL 형식 검증(400) → `parseJobPostingUrl` →
  `{ parsed: ParsedJobPosting }` 반환. `runtime = "nodejs"`.
- 에러 매핑: `ScrapeError` 502, `LlmError` 는 무시(부분 결과), 그 외 500.

### 38-3. UI — `src/features/add-job-posting`
- `ui/form.tsx` 에 "URL로 채우기" 입력 + 버튼 추가. 클릭 → `fetch("/api/job-posting/parse")` →
  로딩 → 응답 필드로 폼 상태 채움(빈 필드는 건드리지 않음) → "확인 후 저장하세요" 안내.
- 실패해도 폼은 그대로 두고 에러 메시지만.

### 38-4. 가정한 결정 (아침 확인)
- **법적**: 사용자가 직접 입력한 단일 URL 을 1회 fetch 해 폼 프리필용으로만 파싱. 재배포·저장·크롤링 없음.
  robots.txt 는 단건 사용자 요청이라 확인하지 않음(대량 수집과 구분). → 확인 필요.
- 알려진 3사이트도 상세 파서가 없으므로 실질적으로 메타데이터+LLM 폴백에 의존. 신뢰도 중간.
- 검증: `server/jobs/verify-parse-url.ts` 스모크 — 공개 채용공고 URL 2~3개(schema.org 있는 것 1개,
  없는 것 1개)로 필드 추출 확인. LLM 과부하 시 재시도.

## T39. 관심 공고 북마크 — 우선순위 2 [완료 2026-09-09]

### 39-1. 마이그레이션 — `supabase/migrations/20260909005000_saved_postings.sql`
**이 파일은 이미 `main` 에 있다 (Claude 가 작성, 사용자가 실행 예정). Codex 는 새로 만들지 말고
아래 스펙과 일치하는지 확인만 하고, 39-2(타입 동기화)·39-3(verify 케이스)에 집중한다.**
- `saved_postings`:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `job_posting_id uuid not null references public.job_postings(id) on delete cascade`
  - `created_at timestamptz not null default now()`
  - `unique (user_id, job_posting_id)`
  - RLS `for all to authenticated using ((select auth.uid()) = user_id) with check (동일)` — `job_postings_all_own` 패턴
  - 인덱스 `(user_id, created_at desc)`
- `server/supabase/types.ts` 에 Row/Insert/Update + Relationships 수동 추가 (빈 네임스페이스 shape 손대지 말 것).
- `server/jobs/verify-schema.ts` 에 케이스 추가: 본인 insert 성공, 타 유저 위장 insert 거부, 중복 insert 거부(unique).
- **사용자가 Supabase SQL Editor 에서 실행해야 검증 통과.** Codex 는 파일만.

### 39-2. `src/entities/saved-posting/`
- `model.ts` — `SavedPosting` 타입, camelCase.
- `api.ts` — `listSavedPostingIds(supabase)` (Set 반환), `listSavedPostingsWithDetail(supabase)`
  (`saved_postings` + `job_postings` 조인, 캘린더·목록용), `addSaved(supabase, userId, jobPostingId)`,
  `removeSaved(supabase, jobPostingId)`. SSR + RLS.
- `index.ts` 공개 export.

### 39-3. `src/features/toggle-saved-posting/`
- `lib/actions.server.ts` — `toggleSavedPosting(jobPostingId, next: boolean)` server action.
  `requireUser()` → add/remove → `revalidatePath("/dashboard")` + `/dashboard/calendar`.
- `ui/save-toggle.tsx` — 북마크 아이콘 토글 버튼(`lucide-react` `Bookmark`/`BookmarkCheck`).
- `index.ts`.

### 39-4. 통합
- 대시보드 공고 목록 항목 + 분석 페이지에 `SaveToggle` 추가.
- 대시보드에 "북마크한 공고 N개" 요약 + `/dashboard/calendar` 링크.

## T40. 캘린더 뷰 — 우선순위 3 (T39 의존) [완료 2026-09-09]

### 40-1. 라이브러리
- **가정**: `pnpm add react-big-calendar date-fns` + `react-big-calendar/lib/css/react-big-calendar.css`
  인라인 import. 월(month) 뷰만. 로컬라이저는 `dateFnsLocalizer` + `date-fns/locale/ko`.
- 다중일 이벤트(게시일~마감일)를 막대로 표시하는 표준 기능이 있어 직접 구현보다 안전.
- CSS 는 `src/app/globals.css` 가 아니라 캘린더 위젯에서 import (범위 격리).

### 40-2. `app/(app)/dashboard/calendar/page.tsx`
- `getUser()` 가드 → `listSavedPostingsWithDetail(supabase)` → `CalendarView` 위젯.

### 40-3. `src/widgets/saved-calendar/`
- `ui/calendar-view.tsx` (`"use client"`) — `react-big-calendar` `Calendar`.
  - 이벤트: `{ title: "회사명 · 직무", start, end, resource: posting }`
  - `start` = `posted_at` (없으면 `saved_posting.created_at`)
  - `end` = `deadline` (없으면 = start 당일, 즉 상시채용은 하루짜리)
  - `onSelectEvent` → 상세 패널/모달: `raw_text` 앞 300자 + "원문 보기" 링크 +
    (해당 회사 분석 있으면) "기업분석 보기" 링크
- `lib/to-events.ts` — 순수 변환 함수(테스트 쉽게).

### 40-4. 가정한 결정 (아침 확인)
- 상시채용(마감일 없음): 게시일 기준 하루 이벤트. 게시일도 없으면 북마크한 날.
- 이벤트 클릭 요약은 **LLM 안 씀** — `raw_text` 발췌 + 링크 (Gemini 과부하 회피, 빠름).
- `react-big-calendar` 채택 (직접 월 그리드 대신). 사용자가 원하면 교체 가능.

## T36. 기업분석 모아보기 페이지 — 우선순위 4 [완료 2026-09-09]

### 36-1. `src/entities/company-analysis/api.ts`
- `listRecentAnalyses` 를 확장하거나 `listAnalysesGrouped(supabase, { q?, cursor?, limit? })` 추가:
  회사별로 묶어 `{ companyId, companyName, latest: CompanyAnalysis, count }[]` + 커서.
  `q` 는 회사명 부분일치(`ilike`).

### 36-2. `app/(app)/dashboard/analyses/page.tsx`
- `getUser()` 가드 → `searchParams` 의 `q`/`cursor` → `listAnalysesGrouped` → 위젯.
- 회사 카드: 회사명, 최신 분석 직무·날짜, "N개 이력", (T41 병합 시) 규모 배지.
  카드 클릭 → `/dashboard/analyses/[latestId]`.
- "더 보기" 커서 페이지네이션.

### 36-3. 통합
- 대시보드 헤더/네비에 "기업분석 목록" 링크. hero 로그인 후 진입점에서도 접근 가능하게.

## T35. 공고 검색 + 페이지네이션 — 우선순위 5 [완료 2026-09-09]

### 35-1. `src/entities/job-posting/api.ts`
- `listJobPostings(supabase, opts?)` 시그니처 확장:
  `{ q?: string; employmentType?: EmploymentType; source?: string; onlyOpen?: boolean; cursor?: string; limit?: number }`
  - `q` → `company_name_raw` / `role` `ilike` OR
  - `onlyOpen` → `deadline is null or deadline >= today`
  - `.range()` + `{ count: "exact" }`, `limit` 기본 20
  - 반환 `{ rows: JobPosting[]; total: number; nextCursor: string | null }` (커서 = 마지막 `created_at`+`id`)
- 기존 호출부(`src/views/dashboard`) 갱신. `listJobPostings(supabase)` 무인자 호출도 계속 동작하게 기본값.

### 35-2. 대시보드 UI — `src/views/dashboard/index.tsx` + `src/features/search-job-postings/`
- `searchParams` 기반(RSC): 검색 인풋(제출 시 URL 갱신), 고용형태·출처 셀렉트, "마감 안 지난 것만" 체크
- "더 보기" 버튼(커서). 총 건수 표시("전체 310건 중 20건")
- 서버 컴포넌트 유지, 필터 폼만 `"use client"`

## T37. 스크래핑 범위 정교화 — 우선순위 6 [완료 2026-09-09 — 기존 데이터 정리는 사용자 판단 대기]

### 37-1. `server/scraping/common/role-filter.ts`
- `isRelevantRole(role: string, title?: string): boolean` — 순수 함수.
  - **화이트리스트**(하나라도 포함): `프론트엔드`, `프론트 엔드`, `front-end`, `frontend`, `웹 개발`,
    `웹개발`, `web developer`, `퍼블리셔`, `퍼블리싱`, `UI 개발`, `리액트`, `react`, `next.js`, `vue`,
    `풀스택`, `fullstack`, `full-stack`
  - **블랙리스트**(포함 시 제외, 화이트리스트보다 우선): `영업`, `마케팅`, `회계`, `세무`, `인사`, `총무`,
    `생산`, `제조`, `설비`, `기계`, `전기`, `전자제어`, `화학`, `건축`, `토목`, `간호`, `약사`, `물류`,
    `운송`, `배송`, `상담`, `고객센터`, `CS`, `MD`, `구매`, `안전관리`, `품질관리(QA 아님)`, `연구원(화학/바이오)`
  - 판정: 블랙리스트 매치 → false. 화이트리스트 매치 → true. 둘 다 없음 → false(보수적).
- **가정**: 직무 범위 = 프론트엔드 / 웹 개발 / 웹 퍼블리셔 / 풀스택. (사용자 earlier: "프론트엔드나 웹 개발".
  백엔드·앱·데이터·PM 은 일단 제외. 아침에 확인 → 리스트만 조정하면 됨.)

### 37-2. 각 스크래퍼 결과에 필터 적용
- `server/scraping/{saramin,jobkorea,catch}/client.ts` — 파싱 결과를 `insertCollectedJobPostings` 에
  넘기기 전 `isRelevantRole` 로 거른다. 거른 건수 로그.
- `SCRAPE_SEARCH_KEYWORDS` 권장값을 `.env.example` 주석에 반영: `프론트엔드,frontend,웹개발,퍼블리셔,풀스택`
  (현재 `개발자,it,엔지니어` 는 과도).

### 37-3. 기존 데이터 — 삭제 안 함, 리포트만
- `server/jobs/audit-postings.ts` — 현재 `job_postings` 중 `isRelevantRole` false 인 행 수/샘플을 출력하는
  **dry-run**. 실제 삭제는 사용자 결정 후 별도. (가정: 아침에 사용자가 결과 보고 판단)

### 37-4. verify
- `server/jobs/verify-schema.ts` 등 기존 스모크 영향 없음. `role-filter` 단위 케이스는
  `server/jobs/verify-role-filter.ts` 로 간단히(입력→기대값 표).

## T41. 기업 규모 구분 — 우선순위 7 [완료 2026-09-09]

### 41-1. `server/analysis/company-size.ts`
- `estimateCompanySize(profile: DartCompanyProfile, financials: DartKeyFinancials | null): CompanySizeEstimate`
- `CompanySizeEstimate = { label: "대기업" | "중견기업" | "중소기업" | "스타트업" | "미상"; basis: string; confidence: "낮음" | "중간" }`
- 휴리스틱(법적 정의 근사, 100% 아님 — `basis` 에 근거 문자열):
  - `corpClass` Y(유가증권) + `revenue >= 2조` → 대기업
  - 상장(Y/K) + `revenue >= 1000억` → 중견기업(추정)
  - 상장(Y/K/N) 그 외 → 중견/중소 경계 → `revenue`/`totalAssets` 구간으로
    (`revenue < 400억` 이고 업력 < 7년 → 스타트업, 아니면 중소기업)
  - 비상장 + 재무 없음 + 업력 < 7년 → 스타트업(추정)
  - 비상장 + 재무 없음 + 업력 >= 7년 → 미상
  - 업력 = `establishedDate` 로 계산
- 순수 함수, `server/jobs/verify-company-size.ts` 로 케이스 표 검증.

### 41-2. 분석 결과에 반영 — `server/analysis/types.ts`
- `CompanyAnalysisResult` 에 `estimated_size?: CompanySizeEstimate` 추가.
- `ANALYSIS_SCHEMA_VERSION` 1 → **2** (인터페이스 + Gemini 스키마 주석 + 상수 세 곳).
- **Gemini 가 만드는 필드 아님** — `synthesize.ts` 가 `estimateCompanySize()` 결과를 코드로 stamp
  (talking_points 등 LLM 필드와 분리, `schema_version` stamp 하는 자리에서).
- `company_analyses.result` 는 jsonb 라 마이그레이션 불필요. 구버전 행은 `estimated_size` 없음(옵셔널).

### 41-3. 표시
- `src/widgets/company-analysis-report` 에 규모 배지(라벨 + `basis` 툴팁/작은 글씨 + "추정" 명시).
- T36 회사 카드에도 배지(있을 때만).

## T34 검증 확장 (해당 태스크에서 함께)

E2E(`e2e/day5-report.spec.ts`)에 **LLM 안 쓰는** 시나리오 추가:
- 공고 검색어 입력 → 결과 필터링 + "더 보기"
- 북마크 토글 → 대시보드 요약 카운트 증가 → `/dashboard/calendar` 에 이벤트 노출 (마이그레이션 실행 후에만)
- 기업분석 모아보기 페이지 회사 카드 렌더
- URL 파싱: mock 불가하면 스킵하거나 스모크(`verify-parse-url.ts`)로 대체
리포트(`artifacts/test-reports/`)는 `day6-e2e.md` 로 새로. 통과율·성능·expected/actual 형식 유지(day5.md 34-4).

## 완료 (2026-09-09 야간 자율 세션)

- T35~T41 전부 `main` 병합. `4bdb95e` (T38·T39·T40·T36·T35·T37), `f2fac53` (T41).
- Codex 가 T38~T37 커밋 → T41 작업 중 **시스템 메모리 부족으로 프로세스 강제 종료** →
  Claude 가 6개 검증·병합 + 미커밋 T41 WIP 복구·검증·병합.
- 검증: `main` 에서 tsc / lint(steiger, FSD 위반 0) / build 그린. E2E 회귀 6/6 통과.
- **day6 신규 기능 E2E 시나리오 미추가** (Codex 가 T34 확장 전 종료) — 스모크 스크립트만.
- 상세: `artifacts/ai-notes/2026-09-09 day6 야간 진행.md`.

### 아침 확인·판단 (사용자)
1. T37: 기존 공고 331건 중 **293건(89%)이 직무 범위 밖** — 삭제 / 태그 / 유지?
2. T37: 직무 범위 = 프론트엔드/웹개발/퍼블리셔/풀스택 가정 (백엔드·앱·데이터·PM 제외) — 조정?
3. T38: 사용자가 준 단일 URL 1회 fetch 파싱 (robots 미확인) — OK?
4. T40: `react-big-calendar` 채택, 요약은 raw_text 발췌 — 브라우저에서 실제 렌더 확인 권장.
5. day6 기능 E2E 시나리오 추가 여부.

## 규율 (day5.md 계승)

1. FSD 경계 — `entities → features → widgets → views → app`. 슬라이스마다 `index.ts`. steiger 통과.
2. "내 데이터" 는 SSR 클라이언트 + RLS. `requireUser()` 이음새. admin 은 verify 스크립트·기존 라우트 한정.
3. 보호 페이지는 `app/(app)/dashboard/...` 하위.
4. `feat/day6` 브랜치 → 우선순위 순 태스크별 커밋 → (Claude가) `main` `--no-ff` 병합. main 직접 커밋·push 금지.
5. 커밋 전: `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm build` 그린.
6. 새 패키지: `react-big-calendar`, `date-fns` 만(T40). 그 외 추가 시 blocked 노트.
7. 기존 API 라우트(`/api/company/analyze`, `/api/motivation`) 시그니처 변경 금지. 새 라우트만 추가.
8. `next-env.d.ts` 커밋 금지.
9. 마이그레이션(T39)은 파일만. 실행은 사용자. 검증 실패가 "테이블 없음"이면 코드 문제 아님 — done 노트에 명시.
