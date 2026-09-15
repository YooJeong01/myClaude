# design-system 리뷰 should-fix 반영 완료 (Codex)

- 2026-09-13 21:00
- 브랜치: `feat/design-system`
- 커밋: `89fcf7e` (`[fix] 디자인 시스템 리뷰 지적 반영`)

## 변경 파일

- `panda.config.ts`
  - `#9B9B99` 색상 토큰 `gray495` 추가
  - `#3F3F3F` 색상 토큰 `gray775` 추가
  - `textMuted._dark`를 `{colors.gray495}`로 수정
  - `borderStrong._dark`를 `{colors.gray775}`로 수정
- `src/shared/ui/button.tsx`
  - `size.sm`의 `minHeight: "8"` 오버라이드 제거
  - `h: "8"`은 유지

## 검증

- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 통과 (`eslint . && steiger ./src`, No problems found)
- `pnpm build`: 미실행 (위임 범위 아님)

## 주의

- 병합 요청 안 함. 화면 리스타일과 묶어서 나중에 병합.
- 작업 전부터 있던 미추적 파일 `.claude/settings.local.json`은 건드리지 않음.
