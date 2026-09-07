# 한경컨센서스 수집 모듈 위임 (Codex)

- 2026-09-07 17:46
- 위임자: claude / 실행자: codex (`codex exec`, 백그라운드)
- 병렬성: claude 는 `fix/type-debt`(타입 에러 정리)를 `main` 에 병합 완료. 이 작업은 그것과 파일이 겹치지 않는 신규 디렉터리 작업.

## 배경

`artifacts/goal.md` 기업분석 데이터 소스 3종 중 2종(DART, 네이버 뉴스)은 완료. **한경컨센서스(애널리스트 리포트)만 미착수.**
goal.md 에서 이미 확정된 사항:
- 한경컨센서스 = 애널리스트 리포트 목록/요약 수집, **원문(PDF) 재게시·재호스팅 금지**, "AI 종합용" 입력 자료로만 사용
- 사용자가 2026-09-07 스코프 유지 확정

## 범위 (이 브랜치에서 할 것)

`feat/hankyung-consensus` 브랜치. 신규 디렉터리 `server/hankyung/` 만 생성. 기존 파일 수정 없음.

기존 모듈 컨벤션을 그대로 따를 것 — **`server/naver/` 와 `server/dart/` 를 레퍼런스로 삼는다**:
- `server/hankyung/config.ts` — 베이스 URL, 요청 상수, (스크래핑 리스크/이용범위 인지 주석을 파일 상단에 명시 — `server/scraping/saramin/config.ts` 처럼)
- `server/hankyung/types.ts` — 리포트 메타 타입 (`HankyungReport`: 제목, 증권사, 종목명, 종목코드(있으면), 리포트 종류, 작성일, 원문 URL). 원문 본문/PDF 바이너리는 저장 대상 아님
- `server/hankyung/http.ts` — `server/scraping/common/http.ts` 의 `fetchWithRetry` 재사용 (429/5xx 지수백오프). 새 재시도 로직 만들지 말 것
- `server/hankyung/client.ts` — `fetchRecentReports(opts)` : consensus.hankyung.com 리포트 목록 페이지에서 메타데이터 추출. 종목명/키워드로 필터 가능하게
- `server/jobs/verify-hankyung.ts` — 스모크 스크립트 (`server/jobs/verify-naver.ts` 형식). 삼성전자 등 2~3건 조회해서 콘솔 출력. `.env.local` 불필요하면 그대로, 필요하면 `--env-file` 주석 명시

## 반드시 지킬 것

1. **기존 파일 수정 금지.** `server/hankyung/` 신규 파일 + `server/jobs/verify-hankyung.ts` 만. `package.json` 에 새 의존성 추가 금지 (cheerio 는 이미 devDependencies 에 있음 — 정적 HTML 파싱이면 그거 사용).
2. 커밋 규칙: `feat/hankyung-consensus` 브랜치에서 `[feat] ...` / `[chore] ...` 형식 한글 커밋, 파일 묶음별로 나눠서. **`main` 에 병합하지 말 것, push 하지 말 것.** 브랜치만 남긴다.
3. 커밋 전 검증: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` 통과 확인.
4. `server/` 에서 `next/*` import 금지 (ESLint 가 차단함).
5. **애매하면 멈추고 노트를 남긴다.** consensus.hankyung.com 구조가 예상과 다르거나(로그인 요구, robots 차단, JS 렌더 필수 등), 스크래핑 리스크 판단이 필요하거나, 아키텍처 결정이 필요하면 → 코드를 억지로 완성하지 말고 `artifacts/handover/` 에 `YYYY-MM-DD-HH-MM-codex-hankyung-blocked.md` 로 상황·발견·선택지를 정리해서 남기고 종료.

## 완료 시 보고

`artifacts/handover/` 에 `YYYY-MM-DD-HH-MM-codex-hankyung-done.md`:
- 생성한 파일 목록
- consensus.hankyung.com 실제 구조 (정적 HTML? JSON API? JS 렌더?)
- verify-hankyung.ts 실행 결과 (조회 건수, 샘플)
- 커밋 해시 목록
- 미해결/주의 사항
