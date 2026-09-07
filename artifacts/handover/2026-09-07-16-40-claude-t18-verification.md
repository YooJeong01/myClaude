# 2026-09-07 pm4:40 — Claude — T18 재검증 완료 (스크래퍼 / GHA / 네이버)

## 선행 컨텍스트

`artifacts/handover/2026-09-07-14-55-claude-catch-parser-fix.md`에서 "실행 여부가 불명확하다"고 남겨둔 T18 3개 항목을 이번 세션에서 실제로 실행/확인/해결함. **불명확한 부분은 이제 없음.**

## 결과 요약

| 항목 | 이전 상태 | 이번 세션 결과 |
|---|---|---|
| 사람인 스크래퍼 | 미검증 | ✅ 240건 수집, 20건 신규 삽입 (220건 중복 스킵) |
| 잡코리아 스크래퍼 | 미검증 | ✅ 36건 수집, 29건 신규 삽입 (7건 중복 스킵) |
| 캐치 스크래퍼 | 0건 (T17 파서 수정 후 미검증) | ✅ 283건 수집, 193건 신규 삽입 (JSON API 전환 실전 검증 완료) |
| GHA 워크플로 E2E | 미검증, Secrets 미등록 | ✅ 4개 Secrets 등록 + workflow_dispatch 실행 → 3개 job 전부 success |
| 네이버 뉴스 검색 API | 401 재현됨, 원인 불명 | ✅ NAVER API HUB 이관 문제로 확인, 엔드포인트/헤더 수정 후 정상 조회 확인 |

## 이번 세션에서 한 일 (시간순)

### 1. 네이버 401 진단
- `verify-naver.ts` 실행 → 401 (`NID AUTH Result Invalid`) 재현
- 웹서치로 원인 확인: 2026-06-25 **NAVER API HUB** 출시, 뉴스 검색 API가 이관됨 (신규 신청 2026-07-31 마감)
- 사용자가 이미 API HUB 콘솔에서 새 키를 발급받아 `.env.local`에 반영해둔 상태였음 → 코드만 새 엔드포인트/헤더로 이관하면 되는 상황이었음
- `server/naver/config.ts`, `server/naver/http.ts` 수정:
  - `openapi.naver.com` → `naverapihub.apigw.ntruss.com`
  - `/v1/search/news.json` → `/search/v1/news`
  - `X-Naver-Client-Id/Secret` → `X-NCP-APIGW-API-KEY-ID/KEY`
- 재검증: 삼성전자/현대자동차/NAVER 3건 모두 정상 조회됨

### 2. 스크래퍼 재검증 (로컬)
- `pnpm install` 재실행 필요 (cheerio/playwright/googleapis가 devDependencies에 있었는데 로컬 node_modules에서 누락돼 있었음)
- 사람인 실행 → **DB 저장 시 FK 위반**: `SCRAPE_OWNER_USER_ID`(`550e8400-...` 플레이스홀더)가 `profiles`에 존재하지 않음 + `profiles` 테이블 자체가 비어있었음(아직 실제 가입 유저가 없음)
- 해결: 앱에 로그인/회원가입 UI가 아직 없어서(8~9일차 예정), **사용자가 Supabase 대시보드에서 직접 유저 1명 생성** → `handle_new_user` 트리거로 `profiles` 행 자동 생성 확인 → 그 유저 id로 `.env.local`의 `SCRAPE_OWNER_USER_ID` 교체
- 재실행: 사람인 20건 삽입 성공
- 잡코리아 실행 → Playwright Chromium 바이너리 미설치로 실패 (`chrome-headless-shell.exe` 없음). 에러가 `ScrapeError.siteBlocked`로 뭉개져서 원인 파악에 시간 걸림 → `server/scraping/common/browser.ts`의 catch 블록이 실제 에러 메시지를 버리고 있던 버그 발견, 수정(원본 에러 포함)
- `pnpm exec playwright install chromium` 실행 → 잡코리아 재실행 성공 (36건 수집, 29건 삽입)
- 캐치 실행 → **T17 JSON API 파서 수정이 실전에서 정상 동작 확인**: 283건 수집, 193건 삽입 (이전 0건에서 개선)

### 3. 부수적으로 발견한 버그
- `src/shared/api/supabase/middleware.ts`: `supabase.auth.getClaims()`가 세션 없을 때 `{data: null, error}`를 반환하는데 코드가 `data.claims`로 바로 구조분해해서 **비로그인 상태로 아무 페이지나 접속할 때마다 TypeError**가 나고 있었음 (`Cannot read properties of null (reading 'claims')`). 사용자가 로컬 `pnpm dev` 확인 중 직접 발견. `data?.claims`로 수정.

### 4. GHA 워크플로 E2E
- `gh` CLI가 로컬에 없어서 `winget install GitHub.cli`로 설치
- `gh auth login --web` 기기 인증 플로우로 로그인 (토큰을 채팅에 노출하지 않는 방식, `github.com/login/device` 코드 입력)
- `.env.local` 값을 채팅에 출력하지 않고 파이프로 바로 `gh secret set`에 전달하는 방식으로 4개 Secrets 등록: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SCRAPE_OWNER_USER_ID`(새 값), `SCRAPE_SEARCH_KEYWORDS`
- 1차 `workflow_dispatch` 실행 → **3개 job 전부 실패**: `pnpm/action-setup@v4`의 `version: 9` 입력이 `package.json`의 `packageManager: "pnpm@9.15.4"`와 충돌 (`Error: Multiple versions of pnpm specified`)
- `.github/workflows/scrape-postings.yml`에서 3개 job 모두 `version: 9` 입력 제거
- 2차 `workflow_dispatch` 실행 (run id `34096221716`) → **3개 job 전부 success**

## git 상태

- 브랜치 `fix/t18-scraper-gha-naver-verification`에서 4개 커밋(태스크 스텝별) → `main`에 fast-forward merge → push 완료
  - `afe4797` 네이버 API HUB 이관
  - `35b6b9c` 미들웨어 getClaims null 수정
  - `956ff4c` Playwright 에러 메시지 노출
  - `2a3a73e` GHA pnpm 버전 충돌 해결
- `main`, `origin/main` 동기화됨
- `next-env.d.ts`가 로컬 `pnpm dev` 실행으로 자동 변경된 상태로 남아있음 (커밋 안 함, 이번 작업과 무관)

## 환경 변경 사항 (다음 세션 참고)

- 로컬에 `gh` CLI 설치됨 (`winget install GitHub.cli`), `YooJeong01` 계정으로 인증된 상태
- 로컬에 Playwright Chromium 브라우저 바이너리 설치됨
- GitHub 저장소(YooJeong01/myClaude)에 Actions Secrets 4개 등록됨
- `.env.local`의 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`는 NAVER API HUB(NCP) 키로 교체됨, `SCRAPE_OWNER_USER_ID`는 Supabase 대시보드에서 만든 실제 유저 id로 교체됨

## 다음 세션 참고

- `pnpm exec tsc --noEmit` 실행 시 이번 작업과 무관한 기존 타입 에러들이 있음(`server/job-postings/persist.ts`, `server/jobs/collect-email-postings.ts`, `server/jobs/verify-job-posting.ts`, `server/scraping/saramin/parser.ts`, `src/entities/job-posting/api.ts`) — Day2 스크래핑 작업(T8~T17) 병합 과정에서 누적된 것으로 보임, 별도로 다룰 필요
- GHA 스케줄(`0 0,12 * * *`, 하루 2회)이 이제 정상 동작할 것으로 예상되나, 다음 정기 실행에서 한 번 더 확인 권장
- 사람인 스크래퍼의 날짜 파싱 실패 경고(`"09/30(수)\n입사지원"` 형태)가 다수 발생함 — 저장 자체는 되지만(날짜 없이?) 파서 개선 여지 있음, 우선순위는 낮음
