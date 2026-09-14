# 공고 목록 필터 review-fix 완료 (Codex)

- 생성: 2026-09-14 09:44
- 브랜치: `feat/job-listing-filters`
- 코드 커밋: `ece1508` (`[fix] job listing filter review fixes`)
- main 병합/push: 하지 않음

## 수정 파일

- `src/entities/job-posting/d-day.ts`
  - D-day 계산을 KST 달력 날짜 차이에서 실제 남은 시간(ms) 기준으로 변경.
  - 24시간 이내는 기존 확정 문구인 `N시간 전` 유지.
  - 사용하지 않게 된 KST calendar helper 제거.
- `src/views/dashboard/index.tsx`
  - 페이지네이션 이전/다음 비활성 상태에서 `<Link>`를 렌더하지 않고 실제 disabled `Button`만 렌더하도록 변경.
- `src/features/search-job-postings/ui/filter-form.tsx`
  - `onlyClosed`를 체크박스에서 `select` 필터로 변경.
  - submit 처리도 `onlyClosed=1`/없음 쿼리 계약에 맞춰 일반 select 파라미터 처리로 변경.
  - `showClosed` 체크박스는 유지.

## 검증

- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 통과 (`eslint . && steiger ./src`, No problems found)
- `pnpm build`: 통과
  - Next.js ESLint plugin 미감지 경고는 기존 설정 관련 warning으로 빌드 성공.

## 메모

- `pnpm build`가 `next-env.d.ts`를 변경했으나 워크플로 지침대로 커밋 전 원복함.
- 기존 미추적 파일 `.claude/settings.local.json`, `artifacts/handover/2026-09-14-09-15-claude-job-listing-filters-review-fix-delegation.md`는 건드리지 않음.
- 추가 패키지/env/마이그레이션 없음.
- 미해결 항목 없음.
