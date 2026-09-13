# 화면 스펙: dashboard

- 대상: `src/views/dashboard/index.tsx` (`DashboardView`).
- 선행: `app-shell.md` (사이드바 레이아웃이 먼저 들어가야 함).
- 목업 참조는 톤·카드 스타일만 — **실제 콘텐츠 구조는 아래(현재 코드 기준)를 따른다.** 목업의
  "최근 기업분석"/"다가오는 마감" 미리보기는 이 화면에 없음(그 콘텐츠는 각각 `/dashboard/analyses`,
  `/dashboard/calendar`에 있음) — 억지로 옮기지 않는다.

## 현재 → 변경 (파일:영역 → 처리)

- **바깥 래퍼** (`index.tsx:66-67`, `<main className="min-h-screen bg-background px-6 py-8"><div
  className="mx-auto max-w-5xl">`) — **삭제**. `app/(app)/layout.tsx`가 컨테이너를 맡는다.
- **헤더** (`index.tsx:68-92`) — 이메일 표시 + 로그아웃 폼은 **삭제**(사이드바 하단으로 이동, app-shell
  스펙 참조). 남기는 것: `<h1>공고 대시보드</h1>` (`textStyle: "3xl"`, `fontWeight` 이미 포함) +
  "기업분석 목록"/"채용 캘린더" 링크 버튼(`Button variant="outline" size="sm"`, 로그아웃 버튼은 제거되니
  이 둘만). `border-b pb-5` → `borderColor: border, borderBottomWidth: 1px, pb: 5`.
- **2열 섹션** (`index.tsx:94-141`, `수동 공고 입력` + `저장된 공고/북마크/경험` aside):
  - 두 패널 다 `rounded-md border bg-card p-5 text-card-foreground` → **`Card`** 프리미티브 (`p: 5`
    추가 지정).
  - aside 안 숫자 통계(`text-3xl font-semibold`) → `textStyle: "3xl"`. 구분선(`border-t pt-5`) →
    `borderColor: border, borderTopWidth: 1px, pt: 5`.
  - "캘린더"/"경험 관리" 링크 버튼 → `Button variant="secondary" className={css({w:"full", mt:4})}` 유지.
- **공고 목록 섹션** (`index.tsx:143-183`):
  - 섹션 제목 `text-lg font-semibold` → `textStyle: "lg"`.
  - 목록 컨테이너 `divide-y rounded-md border bg-card` → `Card` + `& > article { borderTopWidth: 1px;
    borderColor: border }` (첫 항목 제외) 패턴으로.
  - 빈 상태(`postings.length === 0`, `index.tsx:165-167`) → `Card` + `color: textMuted, textStyle: sm`.
  - "더 보기" 버튼 → `Button variant="outline"`.
- **`JobPostingListItem`** (`index.tsx:189-241`):
  - 회사명(`text-sm text-muted-foreground`) → `color: textMuted, textStyle: sm`.
  - 역할명(`text-base font-semibold`) → `textStyle: lg`.
  - 고용형태 배지(`rounded-md bg-secondary px-2.5 py-1 text-xs`, `index.tsx:209-211`) →
    **`Tag variant="gray" size="sm"`**.
  - 메타 정보 줄(등록/마감/원문/최근분석 — `index.tsx:213-234`)은 `color: textMuted, textStyle: sm`,
    링크(`text-primary underline-offset-4 hover:underline`) → `color: link, textDecoration: "underline"`
    on hover만(Panda `_hover: { textDecoration: "underline" }`, 기본은 no-underline — 다른 링크와 통일).
  - 액션 버튼들(`RunAnalysisButton`, `SaveToggle`) — 내부 스타일은 그 컴포넌트 자체 스펙(이번 라운드
    범위 아님, 버튼 프리미티브만 쓰면 자동 반영됨 — 내부에서 `Button` 쓰고 있는지 implement가 확인).

## 반응형

- 360px: 헤더 `flex-col`(이미 `sm:flex-row`라 그대로 둠, `sm` breakpoint를 Panda `md`(768px)로 매핑).
  2열 섹션(`lg:grid-cols-[...]`)은 768px 미만에서 1열.
- 768px: 2열 섹션 진입.
- 1280px: `app-shell`의 `container` maxW 적용, 추가 grid 변경 없음.

## 다크모드

- 전부 semantic token이라 자동. 배지(`Tag variant="gray"`)만 다크에서 대비 확인.

## 상태 / 터치 타깃

- 빈 목록, "더 보기" 없음(nextCursor 없음) — 기존 조건부 렌더 유지.
- 목록 액션 버튼(RunAnalysisButton/SaveToggle)이 버튼 프리미티브를 쓰면 44px는 자동 충족.
