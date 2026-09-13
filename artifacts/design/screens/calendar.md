# 화면 스펙: calendar

- 대상: `app/(app)/dashboard/calendar/page.tsx`, `src/widgets/saved-calendar/ui/calendar-view.tsx`.
- 선행: `app-shell.md`.
- 목업 참조: `Calendar.dc.html` (월간 그리드 + 우측 "이번 달 일정" 리스트, D-day 배지 색 — 실제로는
  `react-big-calendar` 라이브러리를 쓰고 있어서 목업처럼 순수 커스텀 마크업이 아니다. 아래 "react-
  big-calendar 테마 오버라이드" 섹션이 핵심.)

## 페이지 (`calendar/page.tsx`)

- 바깥 래퍼(`:20-21`) — 삭제(app-shell). `space-y-6`은 유지.
- 헤더(`:22-39`): "북마크한 공고"(`text-sm font-medium text-muted-foreground`) → `textStyle: sm,
  fontWeight:500, color: textMuted`. 제목 → `textStyle: "3xl"`. "대시보드"/"기업분석 목록" 버튼 →
  `Button variant="outline" size="sm"`(dashboard.md 헤더 버튼과 통일).
- 빈 상태(`:44-46`, `rounded-md border bg-card p-6`) → `Card` (`p: 6`) + `textStyle: sm, color: textMuted`.

## `CalendarView` 컨테이너 (`calendar-view.tsx:41`)

- `h-[680px] rounded-md border bg-card p-3` → `Card`에 `h: "680px", p: 3` 지정(고정 높이는 유지).

## react-big-calendar 테마 오버라이드 (핵심)

`react-big-calendar`는 자체 클래스(`.rbc-*`)로 DOM을 그려서 `Card`/`Tag`처럼 컴포넌트를 바로 못 바꾼다.
`src/app/globals.css`(Panda 스타일시트 import 아래)에 **전역 오버라이드 블록**을 추가해서 색만 우리
토큰에 맞춘다 — 구조는 안 건드림. Panda 토큰을 CSS에서 쓰려면 `var(--colors-xxx)` 형태(Panda가
`:root`에 생성하는 CSS 변수)를 참조하거나, semantic token의 실제 값을 그대로 하드코딩(다크모드 대응
필요하면 `.dark .rbc-...` 블록도 같이). 최소 오버라이드 대상:

- `.rbc-today` (오늘 셀 배경) → `surface` 톤.
- `.rbc-off-range-bg` (다른 달 셀) → `bg`보다 살짝 어둡게(예: `surface`의 절반 투명도).
- `.rbc-header`, `.rbc-month-view`, `.rbc-day-bg` 테두리 → `border` 토큰 색으로, 두께 1px.
- `.rbc-toolbar button` (월 이동 등 기본 툴바 버튼) → `Button` 프리미티브 톤에 맞춰 재정의(배경/보더/
  라디우스/호버) — 정확히 `Button variant="outline" size="icon"`처럼 보이게.
- `.rbc-event` (일정 이벤트 pill) → 기본은 `tagBlue` 톤(배경/텍스트), 마감 임박(사용자가 만든
  `toSavedCalendarEvents`가 마감 기준으로 분류한다면 그 값 기준) 이벤트는 `tagRed` 톤 — 분류 로직이
  이미 있는지 `src/widgets/saved-calendar/lib/to-events.ts`를 implement가 확인, 없으면 이번 라운드는
  전부 `tagBlue` 톤 하나로 통일하고 마감 임박 색 분기는 다음 라운드로 미뤄도 됨(스펙 이탈 아님, 명시만).
- 폰트: 전역 body 폰트(프리텐다드)가 이미 상속되는지 확인, `react-big-calendar`가 자체 폰트를 강제하면
  `.rbc-calendar { fontFamily: inherit }` 추가.

## `SelectedPostingPanel` (`calendar-view.tsx:59-88`)

- `<aside className="rounded-md border bg-card p-5">` → `Card` (`p: 5`).
- 회사명(`text-sm text-muted-foreground`) → `textStyle: sm, color: textMuted`.
- 역할(`text-lg font-semibold`) → `textStyle: lg`.
- "원문 보기" 버튼 — 이미 `Button variant="secondary"` + lucide `ExternalLink` 아이콘, 유지(아이콘
  라이브러리 그대로 `lucide-react` 사용 — 목업의 손그림 SVG로 안 바꿈).
- 본문 발췌(`whitespace-pre-wrap text-sm leading-6 text-muted-foreground`) → `textStyle: sm, color:
  textMuted`, `whiteSpace: "pre-wrap"` 유지.

## 반응형

- 헤더 `flex-col sm:flex-row` → 768px 기준 유지.
- 캘린더 자체는 `react-big-calendar` 기본 반응형(월 그리드가 좁아지면 셀이 줄어듦)에 맡긴다 — 360px에서
  요일 라벨이 너무 빽빽하면 `.rbc-header` 폰트 크기를 `xs`로 낮추는 것까지만(그 이상 모바일 전용
  리스트뷰 전환 등은 범위 아님).

## 다크모드

- `.rbc-*` 오버라이드 블록은 라이트/다크 값을 각각 지정해야 한다(Panda 토큰을 CSS 변수로 참조하면
  자동 전환되지만, 하드코딩하면 `.dark` selector로 별도 블록 필요 — implement 판단, 가능하면 CSS
  변수 참조 방식을 우선 시도).

## 상태 / 터치 타깃

- 이벤트 클릭 시 `SelectedPostingPanel` 노출 — 기존 로직 유지.
- `.rbc-toolbar button`도 44px 터치 타깃 확보(기본 라이브러리 버튼이 작으면 CSS로 min-height 보정).
