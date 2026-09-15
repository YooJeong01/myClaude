# 육안 QA 발견 2건 수정 위임 (Codex) — 캘린더 CSS 버그 + 다크모드 구현

- 2026-09-14 16:30
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 같은 브랜치 `feat/design-system`에 이어서 커밋. 새 브랜치 안 만듦.
- 배경 문서: `artifacts/test-reports/redesign-visual-qa.md` (root cause까지 특정됨).
- 사용자 결정: 다크모드는 **"시스템 자동 감지 기본 + 수동 토글로 오버라이드 가능"**(3번 안)으로 확정.

## T1. 캘린더 이벤트가 파란 막대로 렌더되는 CSS 버그 수정

**원인**: `react-big-calendar` 기본 CSS(`node_modules/react-big-calendar/lib/css/react-big-calendar.css`)의
`.rbc-event { background-color: #3174ad; ... }`가, `src/app/globals.css`의 오버라이드
(`.rbc-event { background: transparent; ... }`)와 클래스 셀렉터 특정도가 동일한데, Next.js 번들링
순서상 RBC 기본 CSS가 나중에 로드되어 이겨버림.

**수정**: `src/app/globals.css`의 아래 규칙에 `!important`를 추가해서 로드 순서와 무관하게 항상
이기도록 한다:

```css
.rbc-event,
.rbc-day-slot .rbc-background-event {
  border: 0 !important;
  background: transparent !important;
  color: inherit !important;
  min-height: 20px;
  padding: 0;
}
```

`border`/`background`/`color` 세 속성만 `!important`가 필요하다(RBC 기본 CSS가 덮어쓰는 게 이
세 개다 — `node_modules/react-big-calendar/lib/css/react-big-calendar.css`의 `.rbc-event` 규칙과
diff해서 확인해라). `min-height`/`padding`은 경합이 없으니 그대로 둬도 된다.

수정 후 `/dashboard/calendar`를 브라우저로 띄워서(가능하면) 북마크 공고 마감일이 있는 달로
이동해 이벤트가 7px 점으로 보이는지 확인해라. 브라우저 확인이 이번에도 안 되면(기존 dev trace
EPERM 제약) done 문서에 "코드 근거로는 확실하나 브라우저 미확인" 명시하고 넘어가라 — plan이
이어서 스크린샷으로 재확인한다.

## T2. 다크모드 구현 — 시스템 자동 감지 + 수동 토글

지금은 `panda.config.ts`의 `conditions: { dark: ".dark &" }` 설정만 있고 `.dark` 클래스를 붙이는
로직이 전혀 없어서 다크모드가 아예 작동하지 않는다. 다음 3가지를 구현해라.

### T2-1. FOUC 방지 초기화 스크립트

`app/layout.tsx`의 `<html>` 태그 내부, `<body>`보다 먼저 실행되는 인라인 스크립트를 추가한다
(Next.js App Router에서 루트 레이아웃에 `<head>`를 직접 넣는 건 허용된다):

```tsx
<html lang="ko">
  <head>
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`
      }}
    />
  </head>
  <body>
    <Providers>{children}</Providers>
  </body>
</html>
```

`localStorage`에 `theme` 키가 없거나 값이 `'system'`이면 `prefers-color-scheme`를 따르고,
`'dark'`/`'light'`면 그 값을 우선한다. 이 스크립트는 hydration 전에 동기 실행되어야 하므로
`next/script`가 아니라 순수 `<script>` + `dangerouslySetInnerHTML`을 써라(`next/script`의
`beforeInteractive`도 되지만 이 패턴이 더 단순하고 이미 Next.js 공식 다크모드 예제에서 쓰는 방식).

### T2-2. 테마 상태 관리 훅

새 파일 `src/shared/lib/use-theme.ts` (또는 적절한 위치, 기존 `src/shared/lib/` 컨벤션 따라):

```ts
"use client";
import { useCallback, useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | "system";

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemePreference | null;
    setPreferenceState(stored ?? "system");
  }, []);

  const applyClass = useCallback((pref: ThemePreference) => {
    const isDark =
      pref === "dark" ||
      (pref === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const setPreference = useCallback(
    (pref: ThemePreference) => {
      setPreferenceState(pref);
      if (pref === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", pref);
      }
      applyClass(pref);
    },
    [applyClass]
  );

  useEffect(() => {
    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyClass("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [preference, applyClass]);

  return { preference, setPreference };
}
```

(의사코드에 가까움 — Codex가 프로젝트 lint 규칙에 맞게 다듬어도 된다. 핵심 계약만 지키면 됨:
`preference`가 `light`/`dark`/`system` 중 하나, `setPreference`가 `localStorage` + `.dark` 클래스
둘 다 갱신, `system` 선택 시 이후 OS 설정 변경에도 실시간 반응.)

### T2-3. 토글 UI — 사이드바 계정 행 옆에 배치

`src/widgets/app-shell/ui/sidebar.tsx`의 로그아웃 슬롯(`logoutSlot`, 약 219번째 줄) 바로 앞에
3단 토글(라이트/다크/시스템)을 추가한다. 아이콘 3개(예: `lucide-react`의 `Sun`/`Moon`/`Monitor`)를
가로로 나열한 세그먼트 컨트롤 형태로, 현재 선택된 것만 `variant="default"`(또는 배경 강조), 나머지는
`variant="ghost"` 스타일의 작은 아이콘 버튼 3개로 구현해도 되고, 하나의 버튼이 클릭할 때마다
라이트→다크→시스템→라이트로 순환하는 형태여도 된다(더 간단) — 판단은 Codex 재량, 다만 **접힌
사이드바 상태에서도 안 깨지게**(`isCollapsed`일 때 숨기거나 아이콘만 남기는 기존 패턴 따라).

새 클라이언트 컴포넌트로 분리해라(예: `src/widgets/app-shell/ui/theme-toggle.tsx`), `useTheme()`
훅을 사용한다. `sidebar.tsx`는 서버/클라이언트 여부 확인 후 이미 클라이언트 컴포넌트면 그냥 인라인,
아니면 이 작은 조각만 별도 클라이언트 컴포넌트로 분리.

## 검증

- `pnpm exec tsc --noEmit` + `pnpm lint` 통과.
- 가능하면 브라우저로 라이트→다크 토글 클릭 시 배경/글자색이 실제로 바뀌는지, 새로고침 후에도
  선택이 유지되는지(localStorage), "시스템" 선택 시 OS 다크모드 설정과 연동되는지 확인. 안 되면
  done 문서에 미확인 명시.
- `pnpm build`까지 통과 확인.

## 완료 시 보고

`artifacts/handover/<ts>-codex-visual-qa-fixes-done.md`: 변경 파일, 커밋 해시, tsc/lint/build
결과, 브라우저 확인 여부. main 병합·push는 하지 마라.
