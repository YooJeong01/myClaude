# 화면 리스타일 1차 라운드 리뷰 should-fix 반영 완료 (Codex)

- 2026-09-14 00:21
- 브랜치: `feat/design-system`
- 커밋: `c7a831d` (`[fix] 화면 리스타일 리뷰 수정 반영`)

## 변경 파일

- `src/widgets/app-shell/ui/sidebar.tsx`
  - 초기 렌더는 CSS 반응형 폭(`base` 접힘, `md` 펼침)으로 처리.
  - `matchMedia("(max-width: 767px)")` change 리스너 추가.
  - 사용자가 토글한 뒤에는 수동 상태가 뷰포트 자동 상태를 override.
- `src/shared/ui/button.tsx`
  - `size.icon`에 `minWidth: "touchTarget"` 추가.
- `src/shared/ui/card.tsx`
  - `as` prop 추가, 기본값은 기존과 같은 `div`.
- `src/widgets/saved-calendar/ui/calendar-view.tsx`
  - 선택 공고 패널 `Card as="aside"`로 complementary 랜드마크 복구.
- `app/(app)/dashboard/analyses/[id]/motivation/page.tsx`
  - 분석 요약 패널 `Card as="aside"`로 complementary 랜드마크 복구.

## 검증

- `pnpm exec tsc --noEmit` 통과.
- `pnpm lint` 통과 (`eslint . && steiger ./src`, `No problems found`).
- `pnpm build` 미실행 — 위임 범위의 필수 게이트가 아니며 RAM 제약상 생략.

## 미해결 / 주의

- 병합 요청 안 함.
- 작업 전부터 있던 추적 제외 파일 `.claude/settings.local.json`은 건드리지 않음.
