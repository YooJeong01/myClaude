# Day 7 태스크 — 수집 사이트 확대 + 크로스-사이트 중복 제거 (T42~T48)

- 작성: 2026-09-09
- 선행: `day6.md` (T35~T41 + 새벽 후속). `main` 병합·push 완료.
- 배경: 사용자 테스트 중 "공고가 너무 적다" → 사람인 `searchword` 버그 수정 + 페이지 수 상향으로 479건 확보.
  잡코리아는 RSC SPA 로 바뀌어 스크래핑 난이도 급상승 → **원티드·점핏·지행으로 대체 확대.**
  여러 사이트를 긁으면 같은 공고가 중복되므로 크로스-사이트 중복 제거도 함께.
- 원래 Day 7 "워크넷 API + 버퍼" 는 이게 더 급하고 실용적이라 대체(워크넷은 뒤로 밀거나 조건부).

## 작업 방식

- 계획·설계·검증은 Claude, 구현은 Codex 위임(가능하면). 이 문서가 정본.
- Codex 위임: `feat/day7` 브랜치, 태스크별 `[tag] 한글` 커밋, `main` 병합·push 금지.
  막히면 그 태스크만 `artifacts/handover/<ts>-codex-day7-blocked-T##.md` 남기고 다음 태스크로.
- 이 로컬 환경에서 `codex exec` 가 메모리 부족으로 자주 죽음 → 죽으면 Claude 가 이어받아 마무리.
- 마이그레이션(T42·T46)은 파일만 작성. 실행은 사용자.

## 의존성 순서

**T42 → (T43 ∥ T44 ∥ T45) → T47 → T46 → T48**

- T42(source 제약·타입 확장)가 새 스크래퍼 3개의 선행.
- T43·T44·T45(스크래퍼 3개)는 서로 독립 — **병렬 가능**. Codex 세션 나눠도 됨(파일 안 겹침).
- T47(techStacks 필터)은 스크래퍼가 techStacks 를 넘겨야 의미.
- T46(중복 제거 마이그레이션)은 마지막에 — 스크래퍼들이 채우는 `company_name_raw`/`role` 을 보고 정규화 규칙 확정.

---

## T42. `source` 제약 + 타입 확장 [완료 2026-09-09 · 마이그레이션 실행 대기]

### 42-1. 마이그레이션 — `supabase/migrations/<ts>_more_scrape_sources.sql`
`job_postings_source_check` 제약을 확장:
```sql
alter table public.job_postings drop constraint job_postings_source_check;
alter table public.job_postings add constraint job_postings_source_check
  check (source in ('manual','email','scrape_saramin','scrape_jobkorea','scrape_catch',
                    'scrape_wanted','scrape_jumpit','scrape_zighang'));
```
(패턴: `20260905130000_job_postings_scrape_sources.sql`)

### 42-2. 타입 — `server/job-postings/types.ts`
`JobPostingSource` 에 `'scrape_wanted' | 'scrape_jumpit' | 'scrape_zighang'` 추가.
`CollectedJobPosting` 에 `techStacks?: string[]` 추가(T47 용). `server/job-postings/persist.ts` 는
`techStacks` 를 저장하지 않아도 됨(현재 스키마에 컬럼 없음) — role-filter 판정에만 쓰고 버림. 명시적으로 주석.

## T43. 원티드 스크래퍼 [완료 2026-09-09 · 로컬 25건] — `server/scraping/wanted/`

**API (인증 불필요, JSON):**
```
GET https://www.wanted.co.kr/api/chaos/navigation/v1/results
    ?job_group_id=518            # 개발 직군
    &job_sort=job.latest_order
    &years=-1&locations=all
    &limit=20&offset=<page*20>
```
- `job_group_id=518` = 개발. 프론트엔드만 좁히려면 `category_tag` / `job_ids` 파라미터 확인 필요
  (안 되면 개발 전체 받고 role-filter 로 거름 — 이게 더 안전).
- 응답 `data[]`: `id`, `company.name`, `position`(직무), `address.location`/`district`(지역).
- 상세(마감일·본문): `GET /api/chaos/jobs/v4/<id>/details` 또는 `/api/v4/jobs/<id>` — 필요 최소만.
  마감일 없으면 `deadline` null(상시).
- `url`: `https://www.wanted.co.kr/wd/<id>`

**모듈 (catch 패턴):**
- `config.ts` — 베이스 URL, `job_group_id`, `MAX_PAGES` (env `SCRAPE_MAX_PAGES` 재사용), 리스크 주석.
- `client.ts` — `fetchWantedListings(): Promise<CollectedJobPosting[]>`. `fetchWithRetry` 재사용,
  페이지 순회, `filterRelevantPostings(postings, 'wanted')` 적용해 반환.
- `server/jobs/scrape-wanted.ts` — `createAdminClient()` + `SCRAPE_OWNER_USER_ID` →
  `fetchWantedListings()` → `insertCollectedJobPostings(admin, userId, postings, 'scrape_wanted')`.
  (`scrape-catch.ts` 그대로 복제)

## T44. 점핏 스크래퍼 [완료 2026-09-09 · 로컬 17건] — `server/scraping/jumpit/`

**API (인증 불필요, JSON):**
```
GET https://jumpit-api.saramin.co.kr/api/positions?page=<n>&sort=relation
    (직무 필터: jobCategory 파라미터 — 프론트엔드 코드 확인. 안 되면 전체 받고 role-filter)
```
- 응답 `result.positions[]`: `id`, `title`, `companyName`, `jobCategory`(콤마 문자열, "프론트엔드 개발자" 포함),
  `techStacks`(배열 — **T47 용**), `locations`.
- `url`: `https://www.jumpit.co.kr/position/<id>`
- 마감일: 목록에 `dueDate` 있으면 사용, 없으면 상세 `GET /api/position/<id>`.
- 점핏은 **개발 전용 사이트**라 노이즈 적음.

**모듈**: T43 과 동일 구조. `server/jobs/scrape-jumpit.ts`.
`techStacks` 를 `CollectedJobPosting.techStacks` 로 채워 넘김.

## T45. 지행 스크래퍼 [완료 2026-09-09 · api.zighang.com/api/recruitments/v3, 로컬 9건] — `server/scraping/zighang/`

**주의: 지행(`zighang.com/recruitment`)은 Next.js 앱. 공개 API 미확인.**
- 먼저 탐색: `/_next/data/<buildId>/recruitment.json`, 페이지 네트워크 탭의 XHR, 또는 RSC 청크.
- **깔끔한 JSON 리스트 엔드포인트를 15분 안에 못 찾으면 blocked 노트 남기고 이 태스크는 스킵.**
  (잡코리아처럼 RSC-only 면 fragile 스크래퍼 만들지 말 것.)
- 찾으면 T43/T44 와 동일 구조로 구현.

## T46. 크로스-사이트 중복 제거 — 정규화 강화 [완료 2026-09-09 · 마이그레이션 실행 대기]

### 문제
현재 `job_postings` 의 dedup:
```
company_key = lower(btrim(company_name_raw))
role_norm   = lower(btrim(role))
unique nulls not distinct (user_id, company_key, role_norm, employment_type, posted_at)
```
사이트마다 표기가 달라 크로스-사이트 중복이 안 걸러짐:
"㈜카카오" vs "카카오" vs "Kakao", "프론트엔드 개발자(React)" vs "프론트엔드 엔지니어".

### 46-1. 마이그레이션 — `supabase/migrations/<ts>_dedup_normalization.sql`
generated 컬럼 표현식 교체 (drop → re-add, generated 컬럼은 `alter ... using` 불가 → drop/add):
- `company_key`: 소문자 + 공백 전부 제거 + 법인격 토큰 제거
  (`주식회사`, `㈜`, `(주)`, `(유)`, `유한회사`, `inc`, `inc.`, `corp`, `corp.`, `co.`, `ltd`, `ltd.`, `llc`).
  Postgres 표현식: `regexp_replace(lower(coalesce(company_name_raw,'')), '주식회사|㈜|\(주\)|\(유\)|유한회사|\binc\.?|\bcorp\.?|\bco\.?|\bltd\.?|\bllc|\s', '', 'g')`
- `role_norm`: 소문자 + 괄호구간 제거 + 공백정리 + 흔한 수식어 제거
  (`신입`, `경력`, `채용`, `모집`, `공고`, `수시`, `정규직`, `[...]`, `(...)`).
  단 과하게 지우면 서로 다른 직무가 합쳐지니 **보수적으로**. 최소: 괄호구간 + 후행 "채용/모집/공고" + 공백.
- 유니크 제약은 컬럼명 그대로라 자동 유지. 인덱스도.
- **기존 행이 있으면** generated 컬럼 재계산되며 중복이 생길 수 있음(제약 위반). 마이그레이션에
  "재계산 후 중복 행은 가장 오래된 것만 남기고 삭제" 처리를 넣거나, 사용자가 실행 전에
  `audit`/수동 정리. 마이그레이션 파일 상단에 이 주의사항 명시.

### 46-2. `server/jobs/dedupe-postings.ts`
크로스-사이트 중복 현황 리포트 + `--delete`(중복군에서 최신 1건만 남김) dry-run 스크립트.
(`audit-postings.ts` 패턴)

## T47. role-filter 에 techStacks 반영 [완료 2026-09-09 · verify 28/28]

- `classifyRole(role, text?, techStacks?)` 로 시그니처 확장 — techStacks 를 `combined` 에 합쳐서 판정.
  `["React","TypeScript"]` 있으면 STRONG_FRONTEND "react" 매치 → relevant.
- `filterRelevantPostings` 가 `posting.techStacks` 를 넘기도록.
- 기존 호출부(사람인·캐치·잡코리아)는 techStacks 없음 → `undefined` 허용, 하위호환.
- `verify-role-filter.ts` 에 techStacks 케이스 추가
  (예: role="개발자" + techStacks=["Vue"] → relevant).

## T48. 검증 [완료 2026-09-09 · tsc·lint·verify 그린, build 는 호스트 메모리로 미실행]

### 완료 요약 (2026-09-09 새벽)
- Codex 가 T42~T48 전부 커밋 후 프로세스 OOM 종료 → Claude 검증·병합 (`fe84277`).
- 원티드·점핏·지행 스크래퍼 로컬 실행 정상 (수집·파싱·필터). DB insert 는 T42 마이그레이션 실행 후.
- 상세: `artifacts/ai-notes/2026-09-09 day7 진행.md`.
- **사용자**: `more_scrape_sources.sql` 실행 완료 (2026-09-09). 원티드·점핏·지행 로컬 수집 확인
  (원티드 36 / 점핏 27 / 지행 21). `dedup_normalization.sql` 은 아직 미실행 — 크로스-사이트 중복이
  실제로 안 잡혀서(최소 정규화) 급하지 않음.
- `scrape-postings.yml` 에 `scrape-api-sites` job (matrix: wanted/jumpit/zighang) 추가 완료 (`a8f1dc2`).
- **Day 7 마무리 완료.** 잡코리아(RSC SPA)만 보류.

### 후속 버그 수정 (2026-09-09 오후)
- 사람인 파서 셀렉터 전면 교정 (`abf423e`) — 회사명 957건 "기업정보" 버그. 상세는
  `ai-notes/2026-09-09 day7 진행.md` 하단.
- dedup `role_norm` 최소화 + 스크래핑 강도 완화 (기본 3페이지 + 지터) (`ada281f`).

- `pnpm exec tsc --noEmit` / `pnpm lint`(eslint + steiger) / `pnpm build` 그린.
- `verify-role-filter.ts` 통과.
- 새 스크래퍼 각각 로컬 실행(원티드·점핏은 API 라 가벼움 — Playwright 아님):
  `pnpm exec tsx --env-file=.env.local server/jobs/scrape-wanted.ts` → 수집 건수·필터 통과 건수 확인.
- 마이그레이션 실행(사용자) 후 `dedupe-postings.ts` dry-run 으로 중복 감소 확인.
- E2E(`e2e/day5-report.spec.ts`)는 스크래퍼와 무관하나, 대시보드 공고 목록이 늘어난 데이터로도
  정상인지 회귀 1회(9/9 유지).
- `artifacts/test-reports/day7-scrape.md` 에 사이트별 수집량 + 중복 제거 전후 표.

## 확정된 설계 결정

- **D1** 잡코리아는 이번에 손대지 않음(RSC SPA, fragile). 원티드·점핏·(가능하면)지행으로 대체.
- **D2** 각 스크래퍼는 사이트 API 를 직접 호출(원티드·점핏 확인됨). Playwright 는 지행이 불가피할 때만.
- **D3** 직무 좁히기는 각 사이트 파라미터로 하되, 안 되면 개발 전체 받고 `role-filter` 로 거른다(더 안전).
- **D4** 크로스-사이트 중복 기준 = 정규화된 `company_key` + `role_norm` (+ employment_type + posted_at).
  원문 URL 은 사이트마다 다르므로 중복 기준으로 못 씀(참고 저장만).
- **D5** `role_norm` 정규화는 보수적으로 — 서로 다른 직무가 합쳐지는 것보다 중복 몇 개 남는 게 낫다.
- **D6** techStacks 는 DB 에 저장하지 않고 role-filter 판정에만 사용(스키마 컬럼 추가 안 함).

## 규율 (day6.md 계승)

1. 구현은 Codex 위임(가능 시), Claude 는 계획·검증. Codex 사망 시 Claude 인계.
2. `server/` 에 `next/*` import 금지.
3. 브랜치 `feat/day7` → 태스크별 커밋 → `main` `--no-ff` 병합. main 직접 커밋·push 금지.
4. 커밋 전: `tsc --noEmit` / `pnpm lint` / `pnpm build`.
5. 마이그레이션은 파일만. 실행은 사용자.
6. 새 패키지 없이 (스크래퍼는 `fetch` + 기존 `fetchWithRetry`). 필요 시 blocked 노트.
7. `next-env.d.ts` 커밋 금지.
