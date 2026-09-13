# 화면별 리스타일 스펙

design 역할이 화면 하나당 `<screen>.md`를 여기에 쓴다. 형식은 `.agents/design.md` "디자인 스펙 형식 ›
screens/<screen>.md" 참조. implement가 이걸 소비해 **같은 `feat/design-system` 브랜치에 이어서** 적용
(별도 `feat/redesign-screens`로 안 쪼갬 — 파운데이션만 먼저 병합하면 기존 화면이 무스타일로 깨진 채
배포될 위험이 있어서, 화면까지 끝난 뒤 한 번에 병합하기로 함. `.agents/design.md` 참고).

## 2026-09-13 제품 스코프 결정 — 랜딩 페이지 보류, 로그인이 진입점

사용자 결정: **랜딩 페이지 지금 필요 없음.** 루트(`/`)에서 바로 로그인하게 한다. 목업의
`Landing.dc.html`은 아카이브만 하고(참고용) 리스타일 대상에서 제외.

- 영향받는 코드(설계만 — 실제 변경은 implement): `app/(marketing)/page.tsx` 처리 방향 결정 필요
  (제거 or `/login`으로 리다이렉트), `middleware.ts`(`src/shared/api/supabase/middleware.ts:39-44`)의
  미인증 `/dashboard/*` 접근 시 리다이렉트 대상을 `/`(마케팅) → `/login`으로 변경.
- **자동 로그인** 요청 있음 — 정확히 무엇을 뜻하는지 확정 필요(다음 중 하나 또는 조합, Day 9 논의):
  ① 이미 있는 세션 유지(Supabase SSR 쿠키가 이미 처리 — 재방문 시 로그인 화면 자체를 안 보여주고
  바로 대시보드로) ② "로그인 상태 유지" 체크박스로 세션 만료 기간 연장 ③ 구글 OAuth 원클릭
  (로그인 목업에 이미 있는 "구글 계정으로 계속하기" 버튼 활성화 — Day 9 "Google OAuth 여부"와 동일 결정).
  로그인 화면 스펙(`login.md`) 작성 시 이 결정이 필요하다.

## 대상 화면 (의존성 순서 — 공통 레이아웃/내비 먼저)

1. ✅ `app-shell.md` — 신규 `app/(app)/layout.tsx` + `src/widgets/app-shell/ui/sidebar.tsx`(폴더블
   사이드바). 다른 모든 화면의 선행 조건. **작성 완료 (2026-09-13).**
2. `login.md` — 로그인이 진입점(`/`). `app/login/page.tsx`, `src/features/auth/ui/login-form.tsx`.
   **자동 로그인 방식 확정 후 작성 — 아직 보류.**
3. ~~`marketing.md`~~ — **보류.** 랜딩 페이지 불필요 결정으로 리스타일 대상에서 제외.
4. ✅ `dashboard.md` — `src/views/dashboard/index.tsx`. **작성 완료.**
5. `experiences.md` — `app/(app)/dashboard/experiences/page.tsx`, `src/features/manage-experience/`.
   **미작성 — 다음 라운드.**
6. `analyses-index.md` — `app/(app)/dashboard/analyses/page.tsx`. **미작성 — 다음 라운드.**
7. ✅ `analysis-detail.md` — `analyses/[id]/page.tsx`, `src/widgets/company-analysis-report/`.
   **작성 완료.**
8. ✅ `motivation.md` — `analyses/[id]/motivation/`, `drafts/[id]/`, `src/widgets/motivation-result/`,
   `src/features/run-motivation/`. **작성 완료.**
9. `analysis-history.md` — `src/widgets/analysis-history/`. **미작성 — 다음 라운드** (다른 화면 안에
   끼워 쓰는 위젯이라 급하지 않음).
10. ✅ `calendar.md` — `app/(app)/dashboard/calendar/page.tsx`, `src/widgets/saved-calendar/`.
    **작성 완료** (react-big-calendar 테마 오버라이드 포함).
11. `job-postings.md` — `src/features/add-job-posting/`, `src/features/search-job-postings/`,
    `src/features/toggle-saved-posting/`. **미작성 — 다음 라운드.**

**1차 구현 라운드 범위 = ✅ 표시 5개** (app-shell + dashboard + analysis-detail + motivation + calendar).
나머지는 화면이 계속 무스타일로 남아있지만 병합 전에 마저 처리 — 다음 라운드에서.
