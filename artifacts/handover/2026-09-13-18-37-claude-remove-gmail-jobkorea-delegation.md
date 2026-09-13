# 위임 — Gmail 이메일 수집 + 잡코리아 스크래퍼 제거

브랜치: `feat/remove-gmail-jobkorea` (base: `chore/agent-workflow-setup`, 5커밋 위)
대상: implement (Codex, `codex exec --approve-for-me`)

## 배경

Gmail 알림메일 파싱은 리프레시 토큰이 7일마다 만료되고 OAuth 앱이 Testing 모드라 상시 깨져 있고,
잡코리아 스크래퍼는 사이트가 RSC/SPA로 전환되며 0건만 반환한다. 둘 다 더 고치지 않고 기능 자체를
제거하기로 사용자가 결정함 (2026-09-13).

## 스코프 결정 (사용자 확인 완료)

1. **브랜치**: `chore/agent-workflow-setup` 위에 얹어서 진행 (병합 순서는 문제없음, 확인함).
2. **기존 데이터는 유지한다.** `job_postings.source = 'email' | 'scrape_jobkorea'` 인 기존 행을
   삭제하거나 마이그레이션하지 않는다.
3. **DB enum/타입은 그대로 둔다.** `job_postings.source` 컬럼 값 자체나
   `server/job-postings/types.ts` 의 `JobPostingSource` 유니온에서 `'email'`, `'scrape_jobkorea'` 를
   빼지 않는다 — 기존 행을 읽는 코드(필터 드롭다운, 소스 배지 등)가 그대로 동작해야 하기 때문.
   **즉 이번 작업은 "새로 수집하는 경로"만 지우고, "이미 있는 데이터를 표시·필터링하는 경로"는
   건드리지 않는다.**

## 지울 것 (파일/디렉터리 삭제)

- `server/gmail/` 전체 (`auth.ts`, `client.ts`, `config.ts`, `parse.ts`)
- `server/jobs/collect-email-postings.ts`
- `server/jobs/gmail-authorize.ts`
- `server/scraping/jobkorea/` 전체 (`config.ts`, `client.ts`)
- `server/jobs/scrape-jobkorea.ts`
- `.github/workflows/collect-email.yml`

## 고칠 것 (부분 수정)

- `.github/workflows/scrape-postings.yml` — `scrape-jobkorea` job 블록만 삭제. 나머지
  (`scrape-saramin`, `scrape-catch`, `scrape-api-sites` matrix) 는 그대로.
- `.env.example` — `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REDIRECT_URI` /
  `GMAIL_REFRESH_TOKEN` 4줄 삭제.
- `package.json` — `googleapis` 의존성 삭제 (grep 확인 결과 Gmail 관련 3개 파일 외 사용처 없음:
  `server/gmail/auth.ts`, `server/gmail/client.ts`, `server/jobs/gmail-authorize.ts` — 이 파일들이
  전부 삭제되면 `googleapis` 는 미사용이 됨). `pnpm install` 로 lockfile 갱신.

## 건드리지 않을 것 (위 스코프 결정 3번 근거)

- `server/job-postings/types.ts` 의 `JobPostingSource` 유니온 — 그대로 둔다.
- `src/features/search-job-postings/ui/filter-form.tsx` 의 소스 필터 옵션
  (`{ value: "scrape_jobkorea", label: "잡코리아" }`, `{ value: "email", label: "이메일" }`) — 그대로
  둔다. 기존 데이터를 여전히 필터링해서 볼 수 있어야 한다.
- `supabase/migrations/**` — 새 마이그레이션 작성하지 않는다.
- 기존 `job_postings` 테이블 데이터 — 삭제/수정하지 않는다.

## 검증

- `pnpm build` 통과 (삭제된 모듈을 import 하는 곳이 남아있지 않은지 확인 — 특히
  `server/jobs/dedupe-postings.ts`, `server/jobs/audit-postings.ts`, `server/job-postings/persist.ts`
  등에서 죽은 import 없는지).
- `pnpm exec tsc --noEmit` (또는 프로젝트 표준 타입체크 커맨드) 통과.
- E2E는 이 두 소스에 대한 시나리오가 없음을 확인함(day5 리포트 스펙 기준) — 새로 깨지는 케이스 없어야 함.
- `main` 병합 전 상태이므로 `main` push 하지 말 것. `feat/remove-gmail-jobkorea` 에 커밋만 남기고
  완료 보고를 `artifacts/handover/` 에 새 파일로 남길 것.

## 참고

- `artifacts/status.md` 의 "파이프라인" 표에 이 작업 행 추가해뒀음 (holder: plan → 현재 Codex 위임 중).
- 병렬로 `chore/agent-workflow-setup` 위에서 리디자인(design 역할) 문서 작업이 같이 진행 중 —
  파일 충돌 영역 없음(리디자인은 `artifacts/design/**` + 화면 컴포넌트, 이 작업은 `server/`,
  `.github/`, `.env.example`, `package.json`).
