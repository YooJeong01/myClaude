# 화면 스펙: analyses-index (기업분석 모아보기)

- 대상: `app/(app)/dashboard/analyses/page.tsx`.
- 선행: `app-shell.md`, `experiences.md`(같은 라운드의 `Input` 프리미티브 — 이 화면의 검색창이 그걸 씀).

## 현재 → 변경

- **페이지 래퍼**(`:42-43`) — 삭제(app-shell). `space-y-6` 유지.
- **헤더**(`:44-61`): "기업분석 모아보기"(`text-sm font-medium text-muted-foreground`) → `textStyle: sm,
  fontWeight:500, color: textMuted`. 제목 → `textStyle: "3xl"`. "대시보드"/"채용 캘린더" 버튼 →
  `Button variant="outline" size="sm"`(dashboard.md/calendar.md 헤더 버튼과 통일).
- **검색 폼**(`:63-71`): `<input>`(`inputClassName`) → **`Input`** (`flex: 1`). 검색 버튼 — 이미
  `Button`, 유지.
- **카드 그리드**(`:73-83`):
  - 빈 상태(`rounded-md border bg-card p-6`) → `Card` (`p: 6`) + `textStyle: sm, color: textMuted`.
  - "더 보기" 버튼 → `Button variant="outline"`.
- **`CompanyAnalysisCard`** (`:104-129`):
  - `<Link className="block rounded-md border bg-card p-5 ... hover:border-primary">` → `Card`의
    스타일(`cardStyle`)을 가져다 `<Link>`에 적용(`Card` 컴포넌트 자체는 `<div>`/`as` prop이라 `<Link>`엔
    직접 못 씀 — `cardStyle` export를 `cn(cardStyle, css({...}))`로 합성해서 쓴다), `_hover: {
    borderColor: link }`(기존 `hover:border-primary`와 동일 의도, `primary`가 이제 거의 흑백이라
    `link`가 더 적절 — analysis-detail.md의 강조색 처리와 동일 논리).
  - 최신 분석 날짜(`text-sm text-muted-foreground`) → `textStyle: sm, color: textMuted`.
  - 회사명(`text-lg font-semibold`) → `textStyle: lg`.
  - 역할(`text-sm leading-6 text-muted-foreground`) → `textStyle: sm, color: textMuted`.
  - 기업규모 배지(`:120-122`, `rounded-md bg-secondary px-2.5 py-1 text-xs`) → **`Tag
    variant="yellow"`**(analysis-detail.md의 `SizeBadge` 처리와 통일).
  - "N개 이력"(`text-sm font-medium text-primary`) → `textStyle: sm, fontWeight:500, color: link`.

## 반응형

- 카드 그리드(`md:grid-cols-2 xl:grid-cols-3`) → 그대로(360px 1열, 768px 2열, 1280px 3열 — Panda
  breakpoint `md`/`xl`과 이미 맞음).
- 헤더 `flex-col sm:flex-row` → 768px 기준.

## 다크모드

- 카드 hover 보더(`link` 토큰), `Tag variant="yellow"` 다크 대비 확인.

## 상태 / 터치 타깃

- 검색 `Input` + 버튼 44px(프리미티브 기본 충족).
- 카드 전체가 `<Link>`라 클릭 영역은 카드 크기만큼 커서 터치 타깃 문제 없음.
