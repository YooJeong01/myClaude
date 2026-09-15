# 사이드바 접힘 토글 접근성 수정 완료

- 완료 시각: 2026-09-14 08:15
- 실행자: Codex
- 브랜치: `feat/design-system`
- 커밋: `25f4052` (`[fix] 사이드바 접힘 토글 접근성 복구`)

## 변경 파일

- `panda.config.ts`
  - `theme.tokens.sizes.sidebarCollapsed`: `64px` → `72px`
- `src/widgets/app-shell/ui/sidebar.tsx`
  - 접힌 상태 상단 줄: 브랜드 아이콘 숨김, 토글 버튼 중앙 정렬
  - 접힌 상태 토글 버튼: `css({ ml: "auto" })` 제거, `style.marginLeft`로 정적/동적 분리
  - 접힌 상태 하단 줄: 아바타 숨김, 로그아웃 버튼 중앙 정렬

## 계산 재확인

- 접힌 사이드바 폭: `72px`
- 좌우 패딩: `12px * 2 = 24px`
- 내부 가용 폭: `72px - 24px = 48px`
- 아이콘 버튼 터치 타깃: `44px`
- 결과: `48px >= 44px` — 접힌 상태에서 버튼 1개가 잘리지 않고 들어감

## Panda 동적 값 확인

- 새 조건부 값(`display`, `justifyContent`, `marginLeft`)은 모두 `style={{ ... }}`로만 추가
- `css()`에는 런타임 조건부 값을 추가하지 않음
- `styled-system/styles.css`의 `--sizes-sidebar-collapsed`가 `72px`로 갱신된 것 확인

## 검증

- `pnpm exec tsc --noEmit` — 통과
- `pnpm lint` — 통과 (`eslint . && steiger ./src`, 문제 없음)
- 브라우저 클릭 검증 — 이 세션에서는 미실행. 사용자가 실제 앱에서 사이드바 접기/펼치기를 다시 눌러 확인 필요

## 스펙 이탈 / 주의

- 스펙 이탈 없음
- `main` 병합·push 안 함
