# 사이드바 동적 CSS 버그 수정 완료

- 2026-09-14 07:26
- 실행자: Codex
- 브랜치: `feat/design-system`
- 커밋: `13ebd29` (`[fix] 사이드바 폴딩 동적 스타일 수정`)

## 변경 파일

- `src/widgets/app-shell/ui/sidebar.tsx`
  - Panda `css()` 안에 있던 `responsiveValue(...)` 동적 값을 제거.
  - `<aside>` 폭, 브랜드명/메뉴 라벨/이메일 표시, nav 정렬/패딩, 로그아웃 wrapper margin을 인라인 `style`로 분리.
  - 토큰 값은 `var(--sizes-sidebar-collapsed)`, `var(--sizes-sidebar-expanded)`, `var(--spacing-3)` 사용.

## 같은 패턴 확인

- `rg -n "responsiveValue|w: responsiveValue|display: responsiveValue|justifyContent: responsiveValue|px: responsiveValue|ml: responsiveValue" src app`
  - 결과 없음.
- 넓은 `rg -n "css\\(\\{" src app` 확인 결과, 이번 버그와 같은 `responsiveValue(...)` 패턴은 `sidebar.tsx`에만 있었음.

## Panda CSS 생성 확인

- `pnpm dev`의 `predev` 단계에서 `panda codegen && panda cssgen` 성공.
- `styled-system/styles.css` 확인:
  - 토큰 변수 존재: `--sizes-sidebar-collapsed`, `--sizes-sidebar-expanded`, `--spacing-3`.
  - 사이드바 전환에 필요한 값은 이제 인라인 `style`이 CSS 변수로 직접 참조하므로 `.w_sidebarCollapsed`, `.w_sidebarExpanded`, `.d_none`, `.d_inline`, `.px_0` 클래스 생성에 의존하지 않음.

## 검증

- `cmd /c pnpm exec tsc --noEmit` 통과.
- `cmd /c pnpm lint` 통과.
- 브라우저 육안/클릭 검증:
  - in-app Browser: 사용 가능한 브라우저 목록이 비어 있어 실행 불가.
  - `pnpm dev` / `pnpm exec next dev -p 3002`: 둘 다 Next가 `.next/trace`를 열 때 `EPERM`으로 종료되거나 HTTP 응답 준비 전 멈춤.
  - Headless Playwright 로그인 후 클릭 측정 시도: dev 서버가 `/auth/confirm`에 응답하지 않아 `page.goto` 60초 타임아웃.
  - 결론: 코드 정적 검증과 Panda CSS 생성은 완료. 실제 브라우저 클릭 확인은 로컬 Next dev trace 파일 권한/잠금 문제로 미검증.

## 미해결 / 주의

- 기존 `localhost:3000` 리스너(`18308`)는 작업 전부터 존재했고 건드리지 않음.
- 작업 중 띄운 `3001`, `3002` dev 프로세스는 정리함.
- `.claude/settings.local.json` 미추적 파일은 기존 작업물로 판단해 건드리지 않음.
- 병합 요청하지 않음.
