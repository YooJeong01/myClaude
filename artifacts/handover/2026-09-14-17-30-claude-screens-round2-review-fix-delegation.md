# screens 2차 code-review should-fix 4건 반영 위임 (Codex)

- 2026-09-14 17:30
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 브랜치: 같은 브랜치 `feat/design-system`에 이어서 커밋. 새 브랜치 안 만듦.
- 배경: `artifacts/handover/2026-09-14-17-20-review-redesign-screens-round2.md` 리뷰 완료,
  blocker 0 / should-fix 4건. 아래 4건만 반영, nit 6건은 이번엔 스킵(문서에 이미 기록됨).

## 1. `add-job-posting/form.tsx` — "URL로 채우기" 패널 배경색이 조용히 안 먹힘

`<Card className={css({ bg: "surface" })}>` (약 140번째 줄)로 회색 배경을 주려 했는데,
컴파일된 `styled-system/styles.css`에서 `.bg_bgElevated`(Card 기본 배경)가 `.bg_surface`보다
나중에 정의돼 있어서 `cn()`으로 뒤에 넘겨도 못 이긴다. Card 컴포넌트 자체가 `bg: "bgElevated"`를
내부에서 고정으로 주고 있을 가능성이 높다 — `src/shared/ui/card.tsx`를 먼저 확인해서, Card가
`className`으로 넘긴 배경 오버라이드를 못 이기는 구조라면 Card 컴포넌트의 recipe/variants에
`variant="surface"` 같은 옵션을 추가하거나, 이 특정 패널만 `<div>` + `cardStyle`을 직접 조합해서
배경을 확실히 지정해라(어느 쪽이든 Panda `cva`/`css()`만 쓰고 동적 값 직접 전달 금지 —
`.agents/workflow.md` §6-11 참고).

## 2. `analyses/page.tsx`, `experiences/page.tsx` — max-width 삭제로 와이드 화면에서 카드가 넓어짐

기존에 각 페이지 자체가 갖고 있던 `max-w-6xl`(1152px, analyses)/`max-w-5xl`(1024px, experiences)
래퍼가 리스타일 과정에서 삭제됐고, 지금은 공용 레이아웃(`app/(app)/layout.tsx`)의
`maxW: "container"`(1280px)만 적용된다. 두 페이지에 페이지 자체 max-width를 다시 넣어라 —
`analyses/page.tsx`는 `maxW: "6xl"` 상당(1152px), `experiences/page.tsx`는 `maxW: "5xl"` 상당
(1024px)에 해당하는 Panda 토큰/값으로. `panda.config.ts`의 `theme.extend.sizes`에 해당 크기
토큰이 있는지 먼저 확인하고, 없으면 그냥 px 값을 `css({ maxW: "1152px" })` 식으로 직접 써도 된다
(정적 값이라 동적 값 금지 규칙에 안 걸림).

## 3. `experiences/page.tsx` — 사이드바 접힘 상태에서 이메일을 볼 곳이 없어짐

페이지 상단의 `{user.email ?? "로그인 사용자"}` 표시가 "사이드바에 이미 있다"는 이유로
삭제됐는데, 사이드바가 접힌 상태(`isCollapsed`)에서는 그 이메일도 `display:none`이라 근거가
성립 안 한다. 두 가지 중 하나로 고쳐라:
- (a) `experiences/page.tsx`에 이메일 표시를 되돌린다(가장 간단, 안전).
- (b) 사이드바가 접혀 있을 때도 이메일을 어떤 형태로든(예: hover 시 tooltip, 또는 아바타 이니셜)
  확인 가능하게 한다 — 더 스코프가 큼.
**권장은 (a)** — 이번 라운드는 회귀 수정이 목적이니 간단하게 되돌리는 걸 우선해라. (b)를 하고
싶으면 done 문서에 별도로 제안만 남기고 이번엔 (a)로 처리해도 된다.

## 4. 에러 메시지 색상 — `tagRed.text`를 일반 배경 위에 직접 사용

login-form.tsx, job-posting form.tsx, experience-form.tsx 등에서 에러 텍스트 색으로
`tagRed.text`를 쓰는데, 이 토큰은 `tagRed.bg`(옅은 빨강 배경) 위에서 쓰도록 만들어진 배지 전용
색이라 일반 페이지 배경(`bg`/`bgElevated`) 위 대비가 검증 안 됐다(다크모드 `tagRedTextDark
#F4A69B` on `bgElevated #191919`가 특히 의심). `panda.config.ts`의 `semanticTokens.colors`에
일반 에러 텍스트용 토큰(예: `danger` 또는 `errorText`, 라이트: 진한 빨강 계열/다크: 밝은 빨강
계열, 배지 색과는 별개로 대비 기준을 새로 잡은 값)을 새로 추가하고, 에러 메시지 쪽 전부 그 토큰으로
교체해라. 새 토큰 값은 WCAG AA 텍스트 대비(4.5:1) 근사로 판단해서 넣어라(정확한 자동 측정 도구는
없으니 상식적인 진한/밝은 빨강으로 — 예: 라이트 `#C0392B` 계열, 다크 `#FF6B6B` 계열 정도 판단은
Codex 재량).

## 검증

- `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm build` 통과.
- 가능하면 브라우저로 4건 다 실제 확인(패널 배경, 페이지 폭, 사이드바 접었을 때 이메일, 에러
  메시지 대비) — 안 되면 done 문서에 "코드 근거로는 확실하나 브라우저 미확인" 명시.

## 완료 시 보고

`artifacts/handover/<ts>-codex-screens-round2-review-fix-done.md`: 변경 파일, 커밋 해시,
tsc/lint/build 결과, 4건 각각 적용 방식(특히 3번은 (a)/(b) 중 뭘 했는지). main 병합·push는 하지 마라.
