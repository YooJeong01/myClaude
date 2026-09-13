# 화면 스펙: app-shell (공통 레이아웃 + 폴더블 사이드바)

- 대상: 신규 `app/(app)/layout.tsx` (현재 없음 — 새로 만든다), 신규 `src/widgets/app-shell/ui/sidebar.tsx`.
- 목업 참조: `Main.dc.html` / `CompanyAnalysis.dc.html` 등의 좌측 사이드바 (아트보드 우상단 화살표로
  접기/펼치기 직접 확인 가능 — https://claude.ai/code/artifact/5050b9ff-3403-4ca5-b667-5aa733b75f9b).
- **다른 모든 화면 스펙의 선행 조건.** 이게 먼저 들어가야 dashboard/analysis-detail/motivation/calendar가
  제 레이아웃 안에서 렌더된다.

## 현재 → 변경

- 지금은 `app/(app)/` 라우트 그룹에 `layout.tsx`가 없다 — 각 페이지(`DashboardView`,
  `AnalysisPage` 등)가 각자 `<main className="min-h-screen bg-background px-6 py-8"><div
  className="mx-auto max-w-5xl">...`로 감싸고, 이메일 표시·로그아웃 폼도 `DashboardView` 안에 중복돼 있다.
- **신규**: `app/(app)/layout.tsx`가 인증 확인(`getUser()` → 없으면 `redirect("/login")`) +
  `<Sidebar>` + 콘텐츠 컨테이너를 담당. 개별 페이지는 자기 `min-h-screen`/`max-w-5xl` 래퍼와
  이메일·로그아웃 블록을 제거하고 페이지 제목 + 페이지 고유 액션만 남긴다(각 화면 스펙에서 명시).

## 레이아웃 구조

```
<div style="display:flex; minH:100dvh; bg:bg">
  <Sidebar />              <!-- 폭 sidebarExpanded(248px) / sidebarCollapsed(64px), 토큰 있음 -->
  <main style="flex:1; minW:0; maxW:container(1280px); mx:auto; px:{...}; py:{...}">
    {children}
  </main>
</div>
```

## Sidebar (`src/widgets/app-shell/ui/sidebar.tsx`, `"use client"`)

- 상태: `const [collapsed, setCollapsed] = useState(false)`.
- 폭: `collapsed ? "sidebarCollapsed" : "sidebarExpanded"` 토큰, `transition: "width 0.15s ease"`
  (Panda `durations.fast` + `easings.standard`).
- 배경 `bgSidebar`, 우측 `borderColor: border` 1px.
- 상단: 브랜드 마크(작은 정사각형, `bg: primary`, `color: primaryText`, `borderRadius: button`, 이니셜
  1글자) + 브랜드명 텍스트(collapsed면 숨김, `display:none`) + 접기/펼치기 토글 버튼(우측, lucide-react
  `ChevronLeft`/`ChevronRight` 아이콘 — collapsed 여부에 따라 아이콘 스왑).
- 메뉴 (실제 라우트만 — 목업의 "지원동기"는 독립 라우트가 없어서 뺐다):
  - 대시보드 → `/dashboard` (lucide `LayoutDashboard`)
  - 경험 관리 → `/dashboard/experiences` (lucide `UserCircle`)
  - 기업분석 → `/dashboard/analyses` (lucide `Building2`)
  - 캘린더 → `/dashboard/calendar` (lucide `Calendar`)
  - 현재 라우트와 일치하는 항목: `bg: activeBg`, `color: activeText`, `fontWeight: 700`. 나머지:
    `color: textMuted`, `fontWeight: 600`.
  - collapsed일 때: 아이콘만, `justifyContent: center`. 라벨 span `display:none`.
- 하단: 아바타(원형, `bg: surface`) + 이메일(`textStyle: sm`, collapsed면 숨김) + 로그아웃(작은 아이콘
  버튼, lucide `LogOut`, `signOut` 서버 액션 폼 — 서버 컴포넌트인 layout에서 만든 `<form action={signOut}>`을
  클라이언트 Sidebar에 `children`/`slot`으로 내려주거나, Sidebar를 感싸는 서버 wrapper에서 조립).
- 각 메뉴 아이템: `minHeight: touchTarget`(44px), `borderRadius: button`, `px/py` 여유 있게.

## 반응형

- **360px (모바일)**: 사이드바 기본 `collapsed = true`(아이콘 레일)로 시작. 토글로 수동 펼침 가능
  (펼치면 콘텐츠 위에 겹치는 오프캔버스까지는 이번 범위 아님 — 그냥 폭이 넓어지고 콘텐츠가 밀림).
- **768px 이상**: 기본 `collapsed = false`(펼침).
- **1280px**: 콘텐츠 영역 `maxW: container` 안에서 중앙 정렬.

## 다크모드

- 전부 semantic token 참조라 `.dark` 클래스가 `<html>`(또는 상위 wrapper)에 붙으면 자동 전환.
  다크 토글 UI 자체(어디 두는지)는 이번 스펙 범위 아님 — 우선 시스템 설정이나 임시 클래스 토글로 검증.

## 터치 타깃 / 상태

- 메뉴 아이템·토글 버튼·로그아웃 버튼 전부 44px 이상.
- 로딩/빈/에러 상태 없음 (정적 네비게이션).
