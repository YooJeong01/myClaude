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
  미인증 `/dashboard/*` 접근 시 리다이렉트 대상을 `/`(마케팅) → `/login`으로 변경. **이번 라운드에도
  아직 안 함** — 리스타일 스펙 범위 밖(라우팅 로직), Day 9 전후로 implement 태스크 따로.
- **자동 로그인** 요청 — 방식 여전히 미확정(세션연장/체크박스/구글OAuth). `login.md`는 **이 결정을
  기다리지 않고** 지금 있는 매직링크 폼만 리스타일하는 걸로 작성함(OAuth는 나중에 결정되면 추가하기
  쉬운 구조로 메모만 남겨둠). Day 9 "Google OAuth 여부"와 같은 트랙, 여전히 사용자 확인 필요.

## 대상 화면 (의존성 순서 — 공통 레이아웃/내비 먼저)

1. ✅ `app-shell.md` — 신규 `app/(app)/layout.tsx` + `src/widgets/app-shell/ui/sidebar.tsx`(폴더블
   사이드바). 다른 모든 화면의 선행 조건. **작성 완료, 구현·리뷰·should-fix 반영까지 완료 (2026-09-14).**
2. ✅ `login.md` — 로그인이 진입점(`/`). **작성 완료 (2026-09-14)** — 자동 로그인 방식 미확정이지만
   기존 매직링크 폼 리스타일은 그 결정과 무관하게 진행. **구현 대기.**
3. ~~`marketing.md`~~ — **보류.** 랜딩 페이지 불필요 결정으로 리스타일 대상에서 제외.
4. ✅ `dashboard.md` — **작성·구현·리뷰·should-fix 완료.**
5. ✅ `experiences.md` — **작성 완료 (2026-09-14).** 신규 `Input`/`Textarea` 프리미티브 필요 —
   `design-system.md` 프리미티브 표 참고. **구현 대기.**
6. ✅ `analyses-index.md` — **작성 완료 (2026-09-14). 구현 대기.**
7. ✅ `analysis-detail.md` — **작성·구현·리뷰·should-fix 완료.**
8. ✅ `motivation.md` — **작성·구현·리뷰·should-fix 완료.**
9. ✅ `analysis-history.md` — **작성 완료 (2026-09-14).** analysis-detail 화면 안에 끼워 쓰는 위젯.
   **구현 대기.**
10. ✅ `calendar.md` — **작성·구현·리뷰·should-fix 완료** (react-big-calendar 테마 오버라이드 포함).
11. ✅ `job-postings.md` — **작성 완료 (2026-09-14).** dashboard/analyses-index 안에 끼워 쓰는 폼·필터
    3종(add-job-posting/search-job-postings/toggle-saved-posting) + run-analysis-button 메모.
    **구현 대기.**

**1차 라운드(구현·리뷰 완료)** = app-shell·dashboard·analysis-detail·motivation·calendar.
**2차 라운드(스펙 완료, 구현 대기)** = login·experiences·analyses-index·analysis-history·job-postings —
**전체 11개 화면 스펙 작성 완료.** 2차 라운드 구현이 끝나면 육안 확인(라이트/다크·반응형) → 최종
code-review → 사용자 병합.
