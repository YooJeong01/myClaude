# 리디자인 태스크 — 화면 리스타일 (1차 라운드)

- 작성: 2026-09-13 (plan)
- 스펙 정본: `artifacts/design/screens/*.md` (이 문서는 그걸 실행 순서로 정리한 것)
- 브랜치: `feat/design-system`에 이어서 (새 브랜치 안 만듦 — 파운데이션과 같은 병합 단위)
- 선행 완료: Panda CSS 파운데이션(토큰·button/tag/card) — `feat/design-system` 기존 커밋.

## 범위

1차 라운드 = app-shell + dashboard + analysis-detail + motivation + calendar. 나머지 화면
(experiences/analyses-index/login/job-postings/analysis-history)은 다음 라운드 — **이번 라운드가
끝나도 아직 병합하지 않는다** (일부 화면이 여전히 무스타일).

## T## (의존성 순서)

- **T1. app-shell** — 신규 `app/(app)/layout.tsx` + 신규 `src/widgets/app-shell/ui/sidebar.tsx`.
  스펙: `artifacts/design/screens/app-shell.md`. **다른 모든 T##의 선행 조건 — 반드시 먼저.**
- **T2. dashboard** — `src/views/dashboard/index.tsx` 리스타일. 스펙: `dashboard.md`.
- **T3. analysis-detail** — `src/widgets/company-analysis-report/ui/{report,sources,mirrored-report}.tsx`.
  스펙: `analysis-detail.md`.
- **T4. motivation** — `analyses/[id]/motivation/page.tsx`, `experience-picker.tsx`,
  `drafts/[id]/page.tsx`, `motivation-result/ui/{result,mirrored-result}.tsx`. 스펙: `motivation.md`.
- **T5. calendar** — `calendar/page.tsx`, `saved-calendar/ui/calendar-view.tsx` +
  `globals.css`의 `react-big-calendar` 테마 오버라이드. 스펙: `calendar.md`.

T2~T5는 T1만 끝나면 서로 독립적 — 순서 바꿔도 되지만 한 세션이 순차로 처리.

## 검증 (태스크 공통)

- 각 T## 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
- `pnpm dev`로 5개 화면(대시보드, 임의의 기업분석 상세, 지원동기 선택/결과, 캘린더) 육안 확인 —
  라이트/다크 둘 다, 360/768/1280 폭에서.
- 이번 라운드 끝나도 **병합 요청 안 함** — `.agents/design.md` 경고, `artifacts/design/screens/README.md`
  "다음 라운드" 항목 참조.

## 완료 후

- plan이 code-review.
- design이 육안 검토(다크모드·반응형 포함) 후 `artifacts/test-reports/`에 스크린샷 기반 확인 기록은
  선택(정식 qa 라운드는 전체 화면 다 끝난 뒤).
- 남은 화면(experiences/analyses-index/login/job-postings/analysis-history) 스펙은 다음에 이어서.
