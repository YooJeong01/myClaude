# 화면 스펙: analysis-history (지난 분석 이력 위젯)

- 대상: `src/widgets/analysis-history/ui/{history-list,freshness-badge}.tsx`.
- 선행: `app-shell.md`. 이미 `analysis-detail.md`(2026-09-13, 1차 라운드) 화면 안에 끼워 쓰는 위젯이라
  이 스펙 하나로 끝(별도 페이지 없음).

## `AnalysisHistoryList` (`history-list.tsx`)

- 빈 상태(`:22-26`, `rounded-md border bg-card p-5`) → **`Card`** (`p: 5`) + `textStyle: sm, color: textMuted`.
- 목록 컨테이너(`:30`, `divide-y rounded-md border bg-card`) → **`Card`** + 항목 구분선(dashboard.md
  목록 패턴과 동일: `& > article + article { borderTopWidth: 1px, borderColor: border }`, motivation.md
  이력 목록에서 이미 쓴 것과 같은 셀렉터).
- 항목 제목(`:37-40`, `text-sm font-medium text-foreground`, "현재 보고서" 접미사 포함) → `textStyle:
  sm, fontWeight: 500, color: text`.
- 날짜(`:41-43`, `text-sm text-muted-foreground`) → `textStyle: sm, color: textMuted`.
- "결과 열기" 링크(`:47-52`, `text-primary underline-offset-4 hover:underline`) → `color: link`,
  다른 화면들과 동일하게 hover에서만 underline.

## `FreshnessBadge` (`freshness-badge.tsx`)

- `rounded-md bg-secondary px-2.5 py-1 text-xs` → **`Tag variant="gray"`**(신선도는 특별한 경고색이
  필요한 정보가 아니라 중립 — dashboard.md의 "N일 전" 배지와 같은 톤. 아주 최근(예: 오늘)이면
  `variant="blue"`로 구분할 수도 있는데, 그건 `formatRelativeDate`가 상대 시간 문자열만 주지 신선도
  등급을 안 줘서 이번 라운드는 전부 `gray` 하나로 통일 — 등급 분기가 필요해지면 `formatRelativeDate`
  쪽에 threshold 로직 추가하는 별도 태스크로).

## 반응형 / 다크모드 / 상태

- 화면 하나짜리 리스트 위젯이라 별도 반응형 분기 없음(부모 컨테이너 폭에 맞춰 흐름).
- `Tag variant="gray"` 다크 대비는 이미 foundation에서 검증됨(다른 화면에서 재사용 중).
- 현재 보고서 강조(`analysis.id === currentId`) 로직 그대로 유지 — 시각적으로 별도 강조(굵기 외
  배경색 등)를 추가하고 싶으면 `activeBg`를 항목 배경에 살짝 쓸 수 있으나 이번 라운드는 텍스트
  접미사만 유지(스펙 이탈 아님, 범위 최소화).
