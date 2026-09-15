# 리뷰: feat/design-system (파운데이션)

- 2026-09-13 20:57
- 리뷰어: claude (code-review 스킬, low) + plan이 각 지적사항 소스 직접 확인
- 대상: `feat/design-system` (base `main`)

## 요약

blocker 0, should-fix 3, nit 0 (스킬이 지적한 4번째 항목은 검증 결과 오탐으로 판정 — 아래 참고).

## should-fix

1. **`panda.config.ts:97`** — `borderStrong`의 `_dark` 값이 `{colors.gray875}`(`#2A2A2A`)로 돼 있는데,
   `design-system.md` 스펙은 `#3F3F3F`다. `gray875`는 이미 `activeBg`의 dark 값(`panda.config.ts:103`,
   스펙과 일치)이라 `borderStrong` dark가 `activeBg`와 같은 색이 돼버림 — 다크모드에서 카드 보더가
   선택 상태 배경과 구분이 잘 안 될 것. `#3F3F3F` 토큰을 추가하고 `borderStrong._dark`가 그걸 참조하게
   고쳐라.
2. **`panda.config.ts:99`** — `textMuted`의 `_dark` 값이 `{colors.gray500}`(`#9B9A97`)인데 스펙은
   `#9B9B99`다. `gray500`은 이미 `textFaint`의 **light** 값(`panda.config.ts:100`, 스펙과 일치)이라
   `textMuted` dark와 `textFaint` light가 같은 색을 참조하는 상태 — 둘은 스펙상 다른 값이어야 한다.
   `#9B9B99` 토큰을 추가하고 `textMuted._dark`가 그걸 참조하게 고쳐라.
3. **`src/shared/ui/button.tsx`의 `size.sm`** — `minHeight: "8"`(Panda 기본 스페이싱 스케일 기준 32px)가
   base의 `minHeight: "touchTarget"`(44px)를 덮어써서, `sm` 버튼이 `design-system.md`가 명시한
   "터치 타깃 ≥ 44px" 기준 아래로 떨어진다. `sm`의 `minHeight` 오버라이드를 제거하거나(높이는 `h:"8"`로
   시각적으로만 작게, `minHeight`는 `touchTarget` 유지) 스펙에 "sm은 예외" 문구를 추가하든지 — 후자는
   plan/사용자 확인 필요하니 전자를 기본으로 해라.

## 오탐 (조치 불필요, 기록만)

- 스킬이 `src/shared/lib/utils.ts`의 `cn() { return cx(clsx(inputs)); }`가 "cx가 인자 1개만 받아서
  conflict resolution을 못 한다"고 지적했는데, **생성된 `styled-system/css/cx.mjs`를 직접 읽어 확인한
  결과 Panda의 `cx()`는 truthy 문자열을 공백으로 이어붙이기만 하는 순수 조인 함수고, 애초에 JS 레벨
  conflict resolution을 하지 않는다** (Panda의 실제 "마지막 정의가 이긴다" 규칙은 생성된 스타일시트의
  CSS 규칙 순서로 구현되지, class 속성 문자열 순서나 `cx`에 넘기는 인자 개수와 무관하다). 따라서
  `cx(clsx(inputs))`와 `cx(...inputs)`는 기능적으로 동일하다 — 버그 아님. (다만 `cx`를 이미 합쳐진
  문자열에 또 감싸는 건 불필요한 중복 호출이라 나중에 `clsx(inputs)` 하나로 단순화해도 됨 — 선택사항,
  지금 안 고쳐도 됨.)

## 확인한 것 (문제없음)

- `panda.config.ts`의 나머지 semantic token 매핑(`bg`/`bgSidebar`/`bgElevated`/`surface`/`text`/
  `primary`/`primaryText`/`link`/태그 팔레트), `button.tsx`의 variant 5종·`asChild`/`Slot` 유지,
  `card.tsx`/`tag.tsx` 구조, FSD 경계 — 전부 정상.
