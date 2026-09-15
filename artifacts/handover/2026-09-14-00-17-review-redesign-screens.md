# 리뷰: 화면 리스타일 1차 라운드 (T1~T5, `696e4bf..5d8a718`)

- 2026-09-14 00:17
- 리뷰어: claude (code-review 스킬, low) + plan이 각 지적사항 소스 직접 확인
- 대상: `feat/design-system`, 커밋 `696e4bf..5d8a718`

## 요약

blocker 0, should-fix 4 (스킬이 지적한 것 중 1건은 plan이 CSS 동작 확인 후 절반만 사실로 정정 —
아래 참고). 스펙 대비 토큰/프리미티브 사용, react-big-calendar 오버라이드, 빈 Tailwind 클래스 잔존
여부는 전부 정상 확인됨.

## should-fix

1. **`src/widgets/app-shell/ui/sidebar.tsx`** — 사이드바가 첫 페인트에 펼침(248px) 상태로 그려졌다가
   `useEffect`(마운트 후 실행)에서 `matchMedia`로 접힘으로 바뀐다. `useState(false)`가 SSR/초기 상태라
   360px 화면에서 첫 렌더에 넓은 사이드바가 보였다가 접히는 **깜빡임(flash)**이 생긴다.
   `app-shell.md`의 "768px 미만에서 기본 접힘으로 시작" 요구를 어긴다. 서버에서 뷰포트를 알 방법이
   없으니, CSS 미디어쿼리로 초기 폭을 처리(예: `sidebarExpanded`를 `md` breakpoint 이상에서만 적용하는
   Panda 반응형 값)하거나, 최소한 초기 렌더에 `overflow:hidden` + `width:0` 같은 걸로 깜빡임을
   숨기는 방식을 검토해라.
2. **`src/widgets/app-shell/ui/sidebar.tsx`의 `matchMedia` 체크가 한 번만 실행됨** — `useEffect(...,
   [])`라 마운트 시점 뷰포트만 확인하고 `change`/`resize` 리스너가 없다. 로드 후 창 크기를 바꾸거나
   기기를 회전하면 사이드바 상태가 안 따라간다. `mql.addEventListener("change", handler)` 추가해라.
3. **아이콘 버튼(사이드바 토글, 로그아웃) 터치 타깃이 스펙 미달 — 단, 리뷰 스킬 주장보다는 덜 심각.**
   `Button size="icon"`(`src/shared/ui/button.tsx`)이 `h:"10", w:"10", minWidth:"10"`(40px)를 쓰는데,
   base의 `minHeight:"touchTarget"`(44px)는 그대로 살아있다. CSS에서 `min-height`는 더 작은 명시
   `height`보다 항상 우선해서 적용되므로(**높이는 실제로 44px로 렌더된다**, 리뷰가 "40px"라고 한 건
   틀림 — 직접 CSS 박스모델 규칙 확인함), **폭만** 40px로 44px 미달이다. `icon` size variant에
   `minWidth: "touchTarget"`을 추가해서 44×44로 맞춰라(사이드바 토글: `sidebar.tsx`, 로그아웃:
   `app/(app)/layout.tsx` 둘 다 이 variant를 씀 — 프리미티브 하나만 고치면 둘 다 해결).
4. **`<aside>` → `Card`로 바뀌면서 랜드마크(complementary) 시맨틱이 사라짐.**
   `src/widgets/saved-calendar/ui/calendar-view.tsx`의 `SelectedPostingPanel`과
   `app/(app)/dashboard/analyses/[id]/motivation/page.tsx`의 "분석 요약" 패널 둘 다 원래
   `<aside className="rounded-md border ...">`였는데 `<Card>`(내부적으로 `<div>`)로 교체되면서
   `aside`가 없어졌다. `Card`가 `as`/`asChild` prop을 받게 확장하거나(간단한 다형성 prop 추가), 이
   두 자리만 `cardStyle`(`Card`가 export하는 style 객체)을 직접 `<aside>`에 적용하는 식으로 시맨틱을
   되살려라.

## 확인한 것 (문제없음)

- `.rbc-*` 오버라이드(`globals.css`) — Panda 생성 CSS 변수 참조 정확, 다크모드 자동 대응, 44px 터치
  타깃(`.rbc-toolbar button`) 반영됨.
- `app/(app)/layout.tsx`가 각 페이지의 중복 `getUser`/`redirect`/이메일/로그아웃 블록을 제대로
  흡수했음.
- 리스타일된 파일 전체에서 원래 Tailwind `className` 문자열이 남아있는 곳 없음(전부 `css()`/`cn()`로
  교체됨) — 죽은 클래스 없음.
- 버튼 variant/size 선택이 각 스펙(`dashboard.md`/`calendar.md`)과 일치.
