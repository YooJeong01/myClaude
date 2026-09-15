# 상태 보드

- last update: 2026-09-15 22:20 (by plan) — **사용자 직접 지시로 `feat/design-system` → `main`
  병합 + push + 로컬 브랜치 정리까지 완료.** 병합(충돌 0건) → `tsc`+`build` 재검증 통과 →
  `git push origin main`(`a39901c..eee21de`) → 병합된 `feat/design-system` 로컬 브랜치 삭제.
  `chore/session-handover-docs`(다른 세션이 만든 별개 브랜치)는 손대지 않음.

## 현재 페이즈

**리디자인(노션풍) + job-listing-filters 스코프가 `main`에 병합·push 완료.** 로컬/원격
`main` 동기화됨. 로컬 작업 브랜치는 `main` 하나만 남음.

## 작업 트리

- holder: (empty)
- branch: `main` (병합·push 완료, `origin/main`과 동기화).

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
| redesign: screens 1차(app-shell·dashboard·analysis-detail·motivation·calendar) | done | done(스펙 5개) | done(should-fix 4건 반영, `c7a831d`) | 수정 전 리뷰 완료(blocker 0, should-fix 4) | 완료(육안, round3) | 보류 |
| redesign: screens 2차(login·experiences·analyses-index·job-postings·analysis-history) | done | done(스펙 5개, T6~T10) | done (`0ef20fd`, should-fix `3408578`, 768px 필터폼 fix `eaf6dc5`, E2E spec `b00a800`) | 완료(blocker 0, should-fix 4 반영) | 완료(육안, round2+round3) | 보류 |
| redesign: 사이드바 폴딩 버그 1차(동적 css() 값) | done | – | done (`13ebd29`) | 대기(nit만 남음, 병합 비차단) | 완료(실제 클릭, round3) | 보류 |
| redesign: 사이드바 토글 접근불가 버그 2차(폭 부족) | done(근본원인 확인) | – | done (`25f4052`) | 대기(nit만 남음, 병합 비차단) | 완료(실제 클릭, round3) | 보류 |
| redesign: 캘린더 iOS풍 재작업 | done | done | done (`7ad12dc`, blocker fix `0cea55a`) | 대기(nit만 남음, 병합 비차단) | 완료(round2 재확인) | 보류 |
| job-listing-filters (페이지네이션·마감필터·D-day·신입경력) | done | – | done | 완료(blocker 0, should-fix 4건 반영) | 완료(blocker 0) | `feat/design-system`으로 병합 완료 |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- job-listing-filters 관련 후속(병합 자체를 막지는 않음, `main` 병합 전/후 언제든 정리 가능):
  1. `server/jobs/backfill-career-level.ts` dry-run/apply 미실행 — 기존 1574건 `career_level`
     비어있을 가능성 높음.
- screens 2차 리뷰 nit 6건(중복 스타일 정리 등, 병합 비차단) — 여유 있을 때 정리.
- **`feat/design-system` 육안 QA 전부 완료 — `main` 병합 후보 상태.** 병합은 사용자 승인 필요
  (아래 "다음 액션" 참고).

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

- **완료된 검증**: `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm build` + `pnpm test:e2e` 9/9 통과.
  분석상세·지원동기·사이드바 폴딩(실제 클릭) 육안 확인까지 완료(round3,
  `artifacts/test-reports/redesign-visual-qa-round3.md`) — 문제 0건.
- **다음 세션 시작점**: `feat/design-system`을 `main`으로 병합할지 **사용자에게 물어볼 것**.
  병합 명령어(충돌 없음 확인됨, `main`이 base `a39901c`에서 안 움직임):
  ```
  git checkout main && git merge --no-ff feat/design-system
  ```
  사용자가 명시적으로 병합 지시하면 그 자리에서 실행 가능(계획된 병합 게이트 — plan이 스스로
  판단해서 병합하는 것만 막는 것이지 사용자 직접 지시까지 막는 건 아님, `project-multi-agent-workflow`
  메모리 참고). 병합 후 남는 후속(nit 6건, career_level 백필)은 급하지 않음.
- 미확정 사항(병합과 무관, 다음 라운드): 자동 로그인 방식(세션연장/체크박스/구글OAuth 중 택1),
  Day 8(Capacitor+Tauri) 착수 여부.

## 참고

- job-listing-filters 마이그레이션 2건(`deadline` timestamptz, `career_level` 추가)은 사용자가
  Supabase에 적용 완료 (2026-09-14).
- ~~미실행 마이그레이션~~ `supabase/migrations/20260909075000_dedup_normalization.sql` — 사용자가
  2026-09-14 실행 완료.
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에도 실제로
  발생(job-listing-filters → design-system 병합). 병합 직전엔 항상 이 파일을 수동으로 재작성해서
  정리할 것 — 자동 병합에 맡기지 말 것.
