# 리뷰 — feat/remove-gmail-jobkorea

- 대상 diff: `chore/agent-workflow-setup..feat/remove-gmail-jobkorea` (6커밋)
- 스펙: `artifacts/handover/2026-09-13-18-37-claude-remove-gmail-jobkorea-delegation.md`
- 구현 보고: `artifacts/handover/2026-09-13-18-45-codex-remove-gmail-jobkorea-done.md`
- 요약: **blocker 0개, should-fix 2개, nit 1개.** 스펙대로 삭제 범위·유지 범위 모두 정확히 지켜짐
  (`types.ts`, `filter-form.tsx` 무변경 확인). 재리뷰 불필요, should-fix만 반영하고 진행 가능.

## should-fix (병합 전 권장)

1. **`server/scraping/common/browser.ts`** — 이 Playwright `launchBrowser`/`withPage` 래퍼의 유일한
   사용처였던 `server/scraping/jobkorea/client.ts`가 이번에 삭제되면서 완전한 데드코드가 됨
   (`server/scraping/catch/client.ts`는 `fetchWithRetry`를 쓰고, 파일 자체 헤더 주석의 "잡코리아/캐치용"
   설명은 사실과 다름 — 실사용처 0개, repo 전역 검색 확인). 삭제 권장.
2. **`server/scraping/common/rate-limit.ts`** — `MIN_DELAY_MS.jobkorea: 3000` 항목이 참조하는 곳 없이
   남아 데드 설정이 됨. 삭제 권장.

## nit (선택)

1. **`server/job-postings/types.ts`** / **`src/features/search-job-postings/ui/filter-form.tsx`** —
   `'scrape_jobkorea'`, `'email'`을 스펙대로 의도적으로 유지했지만, 그 이유("기존 데이터 조회용,
   수집기는 제거됨")가 코드에는 없고 위임 문서에만 있음. 짧은 인라인 주석 추천 — 나중에 이 값을
   실수로 지우거나(기존 데이터 조회 깨짐), 반대로 "아직 쓰이나?" 하고 스크래퍼를 되살릴 근거로
   오인하는 것 방지.

## 참고 (내 문서 오류, 직접 정정함)

- 위임 문서(`2026-09-13-18-37-...delegation.md`)에 base 브랜치를 "5커밋 위"라고 적었는데 실제로는
  9커밋 위였음. 문서 자체를 정정함 — 코드 변경 아님.
