# 상태 보드

- last update: 2026-09-14 08:56 (by codex) — `feat/job-listing-filters` 구현 완료.
  tsc/lint/build 통과, 마이그레이션 파일은 작성만 완료(사용자 적용 대기).

## 현재 페이즈

**job-listing-filters 구현 완료.** 다음 단계는 code-review → qa.

## 작업 트리

- holder: (없음)
- branch: `feat/job-listing-filters` — 구현 완료, main 병합/push 안 함.
- base: `main` @ a39901c

## 파이프라인

| topic | plan | design | implement | review | qa | merged |
|---|---|---|---|---|---|---|
| Day 1~7 (수집·매칭·리포트·스크래퍼) | done | – | done | – | done | ✅ |
| 배포 (my-claude-ruby.vercel.app) | done | – | – | – | – | ✅ |
| agent-workflow-setup | done | – | – | – | – | ✅ |
| Gmail/잡코리아 제거 | done | – | done | 완료(blocker 0, should-fix 반영) | – | ✅ |
| session-refresh 버그수정 (getClaims→getUser) | done | – | done | 완료(blocker 0) | – | ✅ |
| redesign: design-system | done(스켈레톤) | 진행 필요 | – | – | – | – |
| redesign: screens | done(README 목록) | 진행 필요 | – | – | – | – |
| job-listing-filters (페이지네이션·마감필터·D-day·신입경력) | done | – | done (`0562f96`) | 대기 | 대기 | – |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- job-listing-filters: Supabase 마이그레이션 2건은 파일 작성만 완료. 실제 적용은 사용자 대기.

## 확정된 시각 방향 (참고: `project-design-stack-and-direction` 메모리)

- 무드: **노션(Notion)풍** — 미니멀·모노톤, 브랜드 컬러 없음, 절제된 블루 accent만.
  (1차 토스/카카오풍+짙은 초록 목업을 본 뒤 사용자가 정정 — 2026-09-13 v2)
- 사이드바: 폴더블(접기/펼치기) — 목업에서 실제 클릭 인터랙션으로 구현됨.
- 폰트: 프리텐다드(자체 호스팅 필요). 목업 캔버스는 Google Fonts 제약으로 Noto Sans KR 대체 표시.
- 다크모드: 라이트 + 다크 둘 다
- 스타일링: **Panda CSS 단독** (Tailwind·shadcn·Emotion 제거/미사용, Park UI 컴포넌트 소스 검토)
- 토큰 우선 — 나중에 팔레트 통째로 교체 가능하게 semantic token으로

## 2026-09-13 제품 스코프 결정

- **랜딩 페이지 보류.** 루트(`/`)에서 바로 로그인. `app/(marketing)/page.tsx` 처리 + 미인증
  `/dashboard/*` 리다이렉트 대상(`/` → `/login`) 변경 필요 — implement 몫, 리스타일 스코프에서 제외.
  상세: `artifacts/design/screens/README.md`.
- **자동 로그인 요청 — 방식 미확정.** 세션 유지 연장 / "로그인 유지" 체크박스 / 구글 OAuth 원클릭
  중 확정 필요 (Day 9 "Google OAuth 여부"와 동일 트랙). `login.md` 스펙 작성 전에 결정.
- **디자인 방향(v2 노션풍) 승인.** 컴포넌트별 세부 조정(버튼·태그·밀도)은 마무리 단계로 이연.

## 다음 액션

- code-review: `feat/job-listing-filters` diff 리뷰. 완료 문서:
  `artifacts/handover/2026-09-14-08-56-codex-job-listing-filters-done.md`.
- design: `artifacts/design/design-system.md` 정식 작성 → `feat/design-system` 브랜치에서 Panda 도입
  (Pretendard 자체 호스팅 포함). 랜딩 화면 스펙은 작성 안 함.
- login 화면 스펙은 자동 로그인 방식 확정 후 작성 (그 전엔 스킵하고 dashboard/analysis 등 먼저 진행 가능).

## 참고

- 미실행 마이그레이션: `supabase/migrations/20260914090000_job_postings_deadline_timestamptz.sql`,
  `supabase/migrations/20260914090100_job_postings_career_level.sql` (사용자 적용 대기).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에 실제로 발생
  (`feat/remove-gmail-jobkorea` 병합 시). 병합 직전엔 항상 이 파일을 수동으로 재작성해서 정리할 것 —
  자동 병합에 맡기지 말 것.
