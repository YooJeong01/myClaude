# visual-qa-fixes 완료 보고

- 완료 시각: 2026-09-14 16:48
- 브랜치: `feat/design-system`
- 커밋: `0cea55a` (`[fix] 캘린더 CSS와 다크모드 토글 수정`)

## 변경 파일

- `src/app/globals.css`
  - `.rbc-event`, `.rbc-day-slot .rbc-background-event`의 `border`/`background`/`color`에 `!important` 추가.
- `app/layout.tsx`
  - hydration 전 실행되는 인라인 테마 초기화 스크립트 추가.
- `src/shared/lib/use-theme.ts`
  - `light`/`dark`/`system` 선호도 훅 추가.
  - `localStorage(theme)` 저장/삭제, `<html class="dark">` 동기화, system 모드 OS 변경 감지.
- `src/widgets/app-shell/ui/theme-toggle.tsx`
  - 라이트/다크/시스템 테마 토글 UI 추가.
  - 펼친 사이드바는 3분할 아이콘 버튼, 접힌 사이드바는 단일 순환 아이콘 버튼.
- `src/widgets/app-shell/ui/sidebar.tsx`
  - 로그아웃 슬롯 앞에 `ThemeToggle` 배치.

## 검증

- `pnpm exec tsc --noEmit` — 통과.
- `pnpm lint` — 통과 (`eslint . && steiger ./src`, FSD 경계 문제 없음).
- `pnpm build` — 통과.
- 브라우저 확인 — 미확인.
  - `pnpm dev`는 `http://localhost:3000`에서 정상 준비 완료.
  - Browser 런타임의 사용 가능 브라우저 목록이 빈 배열이라 클릭/스크린샷 확인 불가.
  - 캘린더 CSS는 RBC 기본 CSS와 경합하는 세 속성에 한정해 `!important`를 적용했으므로 코드 근거로는 수정 완료.

## 새 패키지 / env

- 없음.

## 스펙 이탈 / 가정

- 없음.

## 미해결 / 주의

- 실제 `/dashboard/calendar` 이벤트 점 렌더링과 테마 토글 persistence는 plan/qa에서 브라우저 세션으로 재확인 필요.
