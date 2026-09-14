# 상태 보드

- last update: 2026-09-14 10:15 (by plan) — `feat/job-listing-filters` code-review(should-fix 4건
  반영 완료) + qa(blocker 0) 끝. 마이그레이션 2건은 사용자가 Supabase에 적용 완료. 병합 대기.

## 현재 페이즈

**job-listing-filters — plan/implement/review/qa 전부 완료, 사용자 병합 대기.**

남은 할 일(병합을 막는 건 아님, 후속 과제):
1. `e2e/day5-report.spec.ts`의 "공고 검색·페이지네이션" 시나리오가 옛 "더 보기"/`cursor` UI
   기준이라 새 숫자 페이지네이션에서 vacuous pass(아무것도 검증 안 하고 통과)한다 —
   implement에게 새 스펙 작성 위임 필요. 상세: `artifacts/test-reports/job-listing-filters.md`.
2. `server/jobs/backfill-career-level.ts` dry-run/apply 미실행 — 기존 1574건의 `career_level`이
   비어있을 가능성 높음. 사용자가 dry-run 결과 보고 apply 여부 결정.
3. 반응형/다크모드/safe-area 확인은 이번 라운드에서 생략(기능 변경 위주라 우선순위 낮음).

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
| job-listing-filters (페이지네이션·마감필터·D-day·신입경력) | done | – | done (`0562f96`,`ece1508`) | 완료(blocker 0, should-fix 4건 반영) | 완료(blocker 0) | – |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- job-listing-filters: 없음 — plan/implement/review/qa 전부 완료, 마이그레이션도 사용자가 적용
  완료. **`main` 병합만 사용자 결정 대기** (병합 명령어는 아래 "다음 액션" 참고).

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

- **job-listing-filters 병합 대기**: `feat/job-listing-filters`(base `main`@`a39901c`)를 사용자가
  검토 후 `git checkout main && git merge --no-ff feat/job-listing-filters`. 충돌 후보:
  `src/views/dashboard/index.tsx`, `src/features/search-job-postings/ui/filter-form.tsx` —
  `feat/design-system`도 같은 파일을 건드리므로, 두 브랜치 다 병합할 계획이면 순서/충돌 사전점검
  필요(먼저 병합되는 쪽 기준으로 나머지가 리베이스).
- design: `artifacts/design/design-system.md` 정식 작성 → `feat/design-system` 브랜치에서 Panda 도입
  (Pretendard 자체 호스팅 포함). 랜딩 화면 스펙은 작성 안 함.
- login 화면 스펙은 자동 로그인 방식 확정 후 작성 (그 전엔 스킵하고 dashboard/analysis 등 먼저 진행 가능).

## 참고

- job-listing-filters 마이그레이션 2건은 사용자가 Supabase에 적용 완료 (2026-09-14).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에 실제로 발생
  (`feat/remove-gmail-jobkorea` 병합 시). 병합 직전엔 항상 이 파일을 수동으로 재작성해서 정리할 것 —
  자동 병합에 맡기지 말 것.
