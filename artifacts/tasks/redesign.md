# 리디자인 태스크 — 화면 리스타일

- 작성: 2026-09-13 (plan), 2026-09-14 2차 라운드 추가
- 스펙 정본: `artifacts/design/screens/*.md` (이 문서는 그걸 실행 순서로 정리한 것)
- 브랜치: `feat/design-system`에 이어서 (새 브랜치 안 만듦 — 파운데이션과 같은 병합 단위)
- 선행 완료: Panda CSS 파운데이션(토큰·button/tag/card) + 1차 라운드(T1~T5, 리뷰·should-fix 반영까지 완료).

## 범위

**1차 라운드(완료)** = app-shell + dashboard + analysis-detail + motivation + calendar (T1~T5).
**2차 라운드(아래 T6~T10, 이번 위임 범위)** = login + experiences + analyses-index + job-postings +
analysis-history. **이번 라운드가 끝나도 아직 병합하지 않는다** — 전체 화면이 다 끝나야 병합 대상.

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

## 2차 라운드 T## (의존성 순서)

- **T6. experiences** — `app/(app)/dashboard/experiences/page.tsx`,
  `src/features/manage-experience/ui/{experience-form,experience-list}.tsx`. 스펙: `experiences.md`.
  **신규 `Input`/`Textarea` 프리미티브(`src/shared/ui/{input,textarea}.tsx`)를 이 태스크에서 같이
  만든다 — 스펙에 정의돼 있음. T7~T9의 선행 조건 (다들 이 프리미티브를 씀).**
- **T7. login** — `app/login/page.tsx`, `src/features/auth/ui/login-form.tsx`. 스펙: `login.md`.
  OAuth 버튼은 안 넣는다(스펙의 "아래 여지" 절은 메모일 뿐 — 지금 구현 범위 아님).
- **T8. analyses-index** — `app/(app)/dashboard/analyses/page.tsx`. 스펙: `analyses-index.md`.
- **T9. job-postings** — `src/features/add-job-posting/ui/form.tsx`,
  `src/features/search-job-postings/ui/filter-form.tsx`,
  `src/features/toggle-saved-posting/ui/save-toggle.tsx`,
  `src/features/run-analysis/ui/run-analysis-button.tsx`(메시지 텍스트만). 스펙: `job-postings.md`.
- **T10. analysis-history** — `src/widgets/analysis-history/ui/{history-list,freshness-badge}.tsx`.
  스펙: `analysis-history.md`.

T8~T10은 T6(프리미티브)만 끝나면 서로 독립적.

## 검증 (태스크 공통)

- 각 T## 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
- `pnpm dev`로 화면 육안 확인 — 라이트/다크 둘 다, 360/768/1280 폭에서(가능한 범위에서, 인증 세션
  없이도 볼 수 있는 login은 꼭 확인).
- 2차 라운드 끝나도 **병합 요청 안 함** — 전체 11개 화면(README 참고)이 다 끝나야 병합 후보.

## 완료 후

- plan이 code-review.
- design이 육안 검토(다크모드·반응형 포함).
- 2차 라운드까지 끝나면 전체 화면 스펙 소진 — plan이 최종 검증(tsc+lint+steiger+build) + qa 라운드
  (E2E 회귀, `artifacts/test-reports/`) 준비 → 사용자 병합 요청.
