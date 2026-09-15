# 화면 스펙: calendar

- 대상: `app/(app)/dashboard/calendar/page.tsx`, `src/widgets/saved-calendar/ui/calendar-view.tsx`.
- 선행: `app-shell.md`.
- 목업 참조: `Calendar.dc.html` (v1, 월간 그리드 + 우측 "이번 달 일정" 리스트 — v2로 대체됨, 아래 참고).
- **2026-09-14 v2 — 사용자 요청으로 iOS 기본 캘린더풍으로 갱신.** "react-big-calendar 테마 오버라이드"
  섹션이 아래 새 절로 교체됨. 페이지 래퍼/`SelectedPostingPanel`/반응형 절은 그대로 유효.

## 페이지 (`calendar/page.tsx`)

- 바깥 래퍼(`:20-21`) — 삭제(app-shell). `space-y-6`은 유지.
- 헤더(`:22-39`): "북마크한 공고"(`text-sm font-medium text-muted-foreground`) → `textStyle: sm,
  fontWeight:500, color: textMuted`. 제목 → `textStyle: "3xl"`. "대시보드"/"기업분석 목록" 버튼 →
  `Button variant="outline" size="sm"`(dashboard.md 헤더 버튼과 통일).
- 빈 상태(`:44-46`, `rounded-md border bg-card p-6`) → `Card` (`p: 6`) + `textStyle: sm, color: textMuted`.

## `CalendarView` 컨테이너 (`calendar-view.tsx:41`)

- `h-[680px] rounded-md border bg-card p-3` → `Card`에 `h: "680px", p: 3` 지정(고정 높이는 유지).

## iOS 기본 캘린더풍 v2 (핵심, 2026-09-14 갱신)

목표: 픽셀 단위 완전 복제가 아니라 **iOS 캘린더의 가장 특징적인 요소**를 이 프로젝트 톤(노션풍
모노톤 + 절제된 accent)으로 가져온다 — 그리드선 최소화, "오늘"은 빨간 원 배지, 일정은 칸을 채우는
색 블록이 아니라 날짜 아래 작은 점(dot), 요일 헤더는 작고 옅은 회색(일요일만 빨간 톤).
`react-big-calendar`는 DOM 구조가 고정돼 있어(`.rbc-*` 클래스) 완전한 복제는 안 되니, 라이브러리
제약 안에서 최대한 가깝게 — 완벽히 안 되는 부분은 완료 문서에 한계로 남긴다.

### 그리드 — 테두리 최소화

- `.rbc-month-view`, `.rbc-day-bg`, `.rbc-header` 사이 보더를 **거의 안 보이게**: 색은 `border` 토큰
  그대로 두되, 굵기 대신 존재감을 낮추는 쪽으로(가로줄만 아주 얇게 남기고 세로 셀 구분선은 없애는
  것도 검토 — `border-right` 제거하고 `border-bottom`만 유지하면 iOS 느낌에 더 가깝다).
- `.rbc-off-range-bg`(다른 달 날짜): 배경색 대신 **숫자 자체를 `textFaint` 톤으로 옅게** — iOS는 셀
  배경을 안 칠하고 날짜 숫자만 흐리게 한다. `.rbc-off-range` 텍스트 색을 `textFaint`로.
- `.rbc-today` 셀 배경 오버라이드(`surface` 톤 칠하기)는 **제거** — 대신 아래 "오늘 배지"로 대체.

### 요일 헤더

- `.rbc-header`: 배경 없이, `textStyle: xs`, `color: textFaint`, `fontWeight: 600`,
  `textTransform: uppercase`, `letterSpacing: 0.03em` 정도로 작고 옅게.
- 일요일 컬럼만 살짝 빨간 톤(`tagRed.text`) — `react-big-calendar`가 요일 헤더에 요일 인덱스를
  클래스로 안 주면, `culture`/`formats.dayFormat` 커스터마이즈나 `components.header` 오버라이드로
  일요일에만 다른 스타일 span을 렌더해야 할 수 있다 — 간단히 안 되면 이 항목은 생략하고 done 문서에
  "라이브러리 제약으로 생략" 명시(우선순위 낮음, 핵심은 아래 두 개).

### 오늘 배지 (가장 중요한 요소)

- `.rbc-now .rbc-button-link`(오늘 날짜 숫자 링크) — 지름 28~32px 원형 배지로: `display:flex,
  alignItems:center, justifyContent:center, width/height:28px, borderRadius:50%, background:
  var(--colors-tag-red-text)(진한 빨강 계열, 다크모드는 --colors-tag-red-text 다크값이 자동), color:
  white(또는 --colors-primary-text 라이트 기준), fontWeight:700`. 날짜 셀 자체 배경은 그대로(흰/검
  배경 유지) — 배지만 숫자 주위에 뜬다.

### 일정 = 점(dot), 색 블록 아님 (두 번째로 중요)

- 현재 `.rbc-event`가 파란 알약 모양 배경+텍스트인데, 이걸 **작은 원형 점**으로 바꾼다. 텍스트(회사명
  등)는 점 위에 안 보이고, `title` 속성(네이티브 툴팁)이나 클릭 시 `SelectedPostingPanel`로 대체한다.
- 구현 방법: `<Calendar>`에 `components={{ event: DotEvent }}` prop 추가(react-big-calendar가 지원하는
  커스텀 렌더 — 이벤트 텍스트 대신 작은 `<span>` 점 하나만 렌더). `DotEvent`는
  `saved-calendar/ui/` 안에 작게 만들어라(별도 slice 안 만듦, 같은 위젯 폴더).
  - 점 크기 6~8px, `borderRadius:"999px"`.
  - 색: 마감 임박(사용자가 만든 `toSavedCalendarEvents`의 분류 기준이 있으면 그거 기준) →
    `tagRed.text`, 나머지(지원 예정) → `tagBlue.text`. 분류 로직이 없으면 이번 라운드는 전부
    `tagBlue.text` 점 하나로 통일하고 done 문서에 명시(스펙 이탈 아님).
  - 하루에 이벤트가 여러 개면 점을 가로로 나란히(최대 3~4개, 넘으면 RBC 기본 "+N" 동작에 맡김).
  - RBC가 이벤트 없는 기본 렌더에 할당하는 행 높이가 점 하나 기준으론 과할 수 있다 — `.rbc-row-content`/
    `.rbc-event`류에 `minHeight` 줄이는 CSS도 같이 조정해서 날짜 셀이 불필요하게 늘어나지 않게.

### 월 이동 툴바

- 기존 `.rbc-toolbar button`(보더 박스 버튼) 스타일은 **유지**(iOS는 텍스트 화살표만 쓰지만, 이건
  우선순위 낮은 폴리시 항목 — 시간 되면 prev/next 버튼만 `border:none, background:transparent`로
  가볍게 만들어 chevron-only 느낌 내되, 안 되면 지금 스타일 그대로 둬도 스펙 이탈 아님).

### 폰트

- 전역 body 폰트(프리텐다드) 상속 확인 — 기존과 동일.

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

- 이벤트 클릭 시 `SelectedPostingPanel` 노출 — 기존 로직 유지. `DotEvent`로 바뀌어도 클릭 핸들러는
  RBC가 이벤트 wrapper에 그대로 붙이니 `onSelectEvent`는 안 건드림.
- 점(dot) 자체는 6~8px로 작지만, 클릭 가능한 실제 영역은 RBC가 잡아주는 이벤트 wrapper 크기를 따른다
  — 너무 작으면(예: 20px 미만) `.rbc-event`에 `minHeight`/`padding`으로 클릭 영역만 살짝 넓혀줘도 됨
  (점은 시각적으로만 작게, 클릭 영역은 44px에 가깝게 — 안 되면 우선순위 낮은 폴리시 항목으로 명시).
- `.rbc-toolbar button`도 44px 터치 타깃 유지.
