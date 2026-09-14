# 상태 보드

- last update: 2026-09-14 16:20 (by plan) — 육안 QA 진행, blocker 2건 발견:
  (1) 캘린더 이벤트가 점 대신 파란 막대로 렌더(RBC 기본 CSS가 오버라이드를 이김),
  (2) **다크모드가 앱 전체에서 전혀 작동 안 함**(`.dark` 클래스를 붙이는 로직이 어디에도 없음).
  상세: `artifacts/test-reports/redesign-visual-qa.md`. 다크모드는 활성화 방식(시스템 자동감지 /
  수동 토글 / 둘 다) 사용자 결정 필요 — 결정 전까지 fix 위임 보류.

## 현재 페이즈

**`feat/design-system` — job-listing-filters 병합 + 캘린더 iOS풍 작업 완료, 육안 QA에서 blocker
2건 발견.** ⚠️ 이 브랜치는 여전히 병합 보류 — blocker 수정 + 남은 항목 다 끝나야 `main` 병합 후보.

병합 검증(`tsc`+`build`) 완료, `test:e2e` 9/9 통과 확인됨(캘린더 작업 이후 재검증 포함).

## 작업 트리

- holder: (empty)
- branch: `feat/design-system` — job-listing-filters 병합 완료.
- base: `main` @ a39901c

## 참고 (2026-09-14 진행 노트)

- code-review 스킬이 서브에이전트(angle별 병렬)를 여러 개 띄우는데, Claude 세션 사용량 한도에
  걸려 대부분 실패함(리셋 11:50 KST). 이 시간대엔 code-review/Explore 등 서브에이전트 기반
  작업은 재시도해도 또 실패할 가능성 높음 — Codex 위임(별도 프로세스, 이 한도 무관)부터 먼저
  진행하고, code-review는 한도 리셋 후 재시도할 것.

## 파이프라인

| topic | plan | design | implement | review | qa | merged |
|---|---|---|---|---|---|---|
| Day 1~7 (수집·매칭·리포트·스크래퍼) | done | – | done | – | done | ✅ |
| 배포 (my-claude-ruby.vercel.app) | done | – | – | – | – | ✅ |
| agent-workflow-setup | done | – | – | – | – | ✅ |
| Gmail/잡코리아 제거 | done | – | done | 완료(blocker 0, should-fix 반영) | – | ✅ |
| session-refresh 버그수정 (getClaims→getUser) | done | – | done | 완료(blocker 0) | – | ✅ |
| redesign: design-system (파운데이션) | done | done(스펙) | done(should-fix 3건 반영, `89fcf7e`) | 완료(diff 직접 확인) | – | 보류(화면과 묶어서) |
| redesign: screens 1차(app-shell·dashboard·analysis-detail·motivation·calendar) | done | done(스펙 5개) | done(should-fix 4건 반영, `c7a831d`) | 수정 전 리뷰 완료(blocker 0, should-fix 4) | 대기(육안) | 보류 |
| redesign: screens 2차(login·experiences·analyses-index·job-postings·analysis-history) | done | done(스펙 5개, T6~T10) | done (`0ef20fd`) | 대기 | 대기(육안) | 보류 |
| redesign: 사이드바 폴딩 버그 1차(동적 css() 값) | done | – | done (`13ebd29`) | 대기 | 대기(육안) | 보류 |
| redesign: 사이드바 토글 접근불가 버그 2차(폭 부족) | done(근본원인 확인) | – | done (`25f4052`) | 대기 | 대기(육안) | 보류 |
| redesign: 캘린더 iOS풍 재작업 | done | done | done (`7ad12dc`) | 대기 | 대기(육안) | 보류 |
| job-listing-filters (페이지네이션·마감필터·D-day·신입경력) | done | – | done | 완료(blocker 0, should-fix 4건 반영) | 완료(blocker 0) | `feat/design-system`으로 병합 완료 |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- (사이드바 관련: 없음 — 사이드바 코드 수정 완료. **아직 병합 요청 안 함**)
- job-listing-filters 관련 후속(병합 자체를 막지는 않음, `main` 병합 전 정리 권장):
  1. `e2e/day5-report.spec.ts`의 "공고 검색·페이지네이션" 시나리오가 옛 "더 보기"/`cursor` UI
     기준이라 vacuous pass 상태 — implement에게 새 스펙 작성 위임 필요.
  2. `server/jobs/backfill-career-level.ts` dry-run/apply 미실행 — 기존 1574건 `career_level`
     비어있을 가능성 높음.
- **`feat/design-system` 자체가 아직 `main` 병합 후보 아님** — screens 2차 review 대기, 1차/2차
  qa 육안 확인 대기, 캘린더 iOS풍 작업은 구현 완료이나 브라우저 육안 확인 필요.

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

- **병합 직후 검증(우선)**: `pnpm exec tsc --noEmit` + `pnpm build`로 job-listing-filters 병합 후
  회귀 없는지 확인. 특히 `src/views/dashboard/index.tsx`(Pagination + D-day Tag 배지),
  `src/features/search-job-postings/ui/filter-form.tsx`(select 2개 추가) 두 파일은 이번에 수동으로
  충돌 해결했으니 직접 화면도 한번 띄워서 확인 권장.
- plan/code-review/qa: 2차 라운드(T6~T10) + 사이드바/캘린더 수정 결과 확인. tsc/lint는 Codex 기준 통과.
  실제 브라우저 육안 확인 필요(사이드바 폴딩 직접 눌러서 확인, 캘린더 iOS풍 시각 확인). 완료:
  `artifacts/handover/2026-09-14-07-26-codex-sidebar-dynamic-css-fix-done.md`,
  `artifacts/handover/2026-09-14-08-15-codex-sidebar-toggle-fix-done.md`,
  `artifacts/handover/2026-09-14-15-04-codex-calendar-ios-done.md`.
- 전체 완료되면: qa 라운드(E2E 회귀 + 반응형/다크) → 사용자에게 최종 `main` 병합 요청.
- 사용자 기상 후: 자동 로그인 방식(세션연장/체크박스/구글OAuth) 확인 필요.

## 참고

- job-listing-filters 마이그레이션 2건(`deadline` timestamptz, `career_level` 추가)은 사용자가
  Supabase에 적용 완료 (2026-09-14).
- ~~미실행 마이그레이션~~ `supabase/migrations/20260909075000_dedup_normalization.sql` — 사용자가
  2026-09-14 실행 완료.
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에도 실제로
  발생(job-listing-filters → design-system 병합). 병합 직전엔 항상 이 파일을 수동으로 재작성해서
  정리할 것 — 자동 병합에 맡기지 말 것.
