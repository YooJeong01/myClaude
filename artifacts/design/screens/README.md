# 화면별 리스타일 스펙

design 역할이 파운데이션 병합 후 화면 하나당 `<screen>.md`를 여기에 쓴다. 형식은 `.agents/design.md`
"디자인 스펙 형식 › screens/<screen>.md" 참조. implement가 이걸 소비해 `feat/redesign-screens`에서 적용.

## 대상 화면 (의존성 순서 — 공통 레이아웃/내비 먼저)

1. `app-shell.md` — 루트 레이아웃, 내비게이션, 컨테이너 (`app/layout.tsx`, `src/app/providers.tsx`)
2. `login.md` — `app/login/page.tsx`, `src/features/auth/ui/login-form.tsx`
3. `marketing.md` — `app/(marketing)/page.tsx`, `src/views/hero/`
4. `dashboard.md` — `app/(app)/dashboard/page.tsx`, `src/views/dashboard/`
5. `experiences.md` — `app/(app)/dashboard/experiences/page.tsx`, `src/features/manage-experience/`
6. `analyses-index.md` — `app/(app)/dashboard/analyses/page.tsx`
7. `analysis-detail.md` — `analyses/[id]/page.tsx`, `src/widgets/company-analysis-report/`
8. `motivation.md` — `analyses/[id]/motivation/`, `drafts/[id]/`, `src/widgets/motivation-result/`,
   `src/features/run-motivation/`
9. `analysis-history.md` — `src/widgets/analysis-history/`
10. `calendar.md` — `app/(app)/dashboard/calendar/page.tsx`, `src/widgets/saved-calendar/`
11. `job-postings.md` — `src/features/add-job-posting/`, `src/features/search-job-postings/`,
    `src/features/toggle-saved-posting/`
