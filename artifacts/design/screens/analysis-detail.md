# 화면 스펙: analysis-detail (기업분석 리포트)

- 대상: `src/widgets/company-analysis-report/ui/report.tsx` (`CompanyAnalysisReport`),
  `src/widgets/company-analysis-report/ui/sources.tsx` (`AnalysisSourcesView`),
  `app/(app)/dashboard/analyses/[id]/page.tsx` (래퍼).
  `mirrored-report.tsx`(오프라인 미러 버전)는 `report.tsx`와 거의 동일 구조일 것 — 같은 패턴 적용,
  구체 값은 implement가 report.tsx 기준으로 맞춰라.
- 선행: `app-shell.md`.
- 목업 참조: `CompanyAnalysis.dc.html`.

## 현재 → 변경

- **페이지 래퍼** (`analyses/[id]/page.tsx:39-40`, `<main className="min-h-screen ..."><div
  className="mx-auto max-w-5xl space-y-8">`) — 바깥 `min-h-screen`/`max-w-5xl`는 **삭제**(app-shell이
  담당). `space-y-8`은 유지(섹션 간 간격, Panda `display:flex; flexDirection:column; gap:8` 또는
  각 섹션에 `mt` 부여).
- **헤더** (`report.tsx:26-54`):
  - 분석 일시(`text-sm text-muted-foreground`) → `textStyle: sm, color: textMuted`.
  - 회사명(`text-3xl font-semibold`) → `textStyle: "3xl"`.
  - 역할(`text-sm text-muted-foreground`) → `textStyle: sm, color: textMuted`.
  - `SizeBadge`(`report.tsx:83-92`, `rounded-md border bg-secondary px-3 py-2`) → **`Tag
    variant="yellow"`** 로 교체(기업 규모 추정 = 목업에서 yellow 계열로 다뤘던 것과 통일). 2줄 구성(label +
    basis)은 Tag 안에 두 줄 텍스트를 넣거나, Tag 옆에 `textStyle: xs, color: textFaint`로 basis를
    별도 표기 — implement 재량, 다만 색은 tagYellow 토큰 고정.
  - "이 분석으로 지원동기 만들기" 버튼 — 이미 `Button`(default variant) 사용 중, 유지.
  - `action` prop(다시 분석하기 등 버튼들) — 호출부에서 이미 `Button`/`RunAnalysisButton`/`SaveToggle`
    쓰는지 확인, 프리미티브면 그대로.
- **`ReportSection`** (`report.tsx:94-109`, `rounded-md border bg-card p-5`) → **`Card`** (`p: 5`).
  제목(`text-lg font-semibold`) → `textStyle: lg`. 본문(`text-sm leading-6 text-muted-foreground`) →
  `textStyle: sm, color: textMuted`.
- **"지원동기 매칭 소재" 섹션 강조 텍스트** (`report.tsx:72-74`, `text-sm font-medium text-primary`) →
  `textStyle: sm, fontWeight: 500, color: link`(강조 accent는 `link` 토큰 — `primary`는 이제 거의
  흑백이라 강조색으로 안 맞음, 이 문구는 "주목해서 보라"는 의도라 `link`가 더 적절).
- **`BulletList`** (`report.tsx:111-123`) — `list-disc space-y-2 pl-5` 그대로 유지(Panda
  `listStyleType: "disc", pl: 5` 등), 색은 부모 `ReportSection` 본문 톤 상속.
- **`AnalysisSourcesView`** (`sources.tsx`):
  - `<details>` 컨테이너(`rounded-md border bg-card p-4`) → **`Card`** (`p: 4`), `<summary>`는
    `cursor-pointer` + `textStyle: sm, fontWeight: 500` 유지.
  - 섹션 제목(`font-medium text-foreground`) → `fontWeight: 500, color: text`.
  - 링크(`text-primary underline-offset-4 hover:underline`) → `color: link`, dashboard.md와 동일
    링크 처리(hover에서만 underline).
  - 메타(`text-xs text-muted-foreground`) → `textStyle: xs, color: textMuted`.

## 지난 분석 이력 (`analyses/[id]/page.tsx:73-80`, `AnalysisHistoryList`)

- 제목(`text-lg font-semibold`) → `textStyle: lg`.
- `AnalysisHistoryList`/`FreshnessBadge` 내부는 이번 라운드 범위 아님 — 위젯 자체 재사용 컴포넌트가
  `Card`/`Tag`/`Button`을 쓰는지만 implement가 확인, 안 쓰면 다음 라운드로 미뤄도 됨(리스트가 화면
  전체를 지배하는 요소가 아니라 급하지 않음).

## 반응형

- 헤더 `flex-col sm:flex-row` → 768px 미만 세로, 이상 가로(기존과 동일 breakpoint 전환점 유지, `sm`→`md`
  매핑).
- 섹션 카드들은 이미 1열 블록 스택이라 반응형 변경 없음.

## 다크모드

- `Tag variant="yellow"`(기업 규모), `color: link`(강조 텍스트) 다크 대비 확인 — 토큰 기반이라 자동
  전환되지만 눈으로 한 번 확인.

## 상태 / 터치 타깃

- `analysis`가 null인 경우(`page.tsx:73` 조건) 이력 섹션 자체가 안 보임 — 기존 로직 유지, 별도 에러
  카드 없음(범위 밖).
- 모든 버튼·링크 44px 이상 유지(Button 프리미티브 사용 시 자동).
