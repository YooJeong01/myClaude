# 상태 보드

- last update: 2026-09-13 20:00 (by plan) — Gmail/잡코리아 제거 code-review 완료 (blocker 0)

**참고**: 이 파일은 브랜치마다 사본이 갈라진다(git 파일, 병합 전까지). 아래는
`feat/remove-gmail-jobkorea` 기준. 같은 `chore/agent-workflow-setup` 위에 형제 브랜치
`fix/session-refresh`(getClaims→getUser 버그수정, 완료·review 대기)가 따로 있음 — 그쪽 최신 상태는
그 브랜치의 status.md 참고.

## 현재 페이즈

**redesign — 목업 착수 직전.** 구조 세우기(`chore/agent-workflow-setup`) 병합 대기. 시각 방향 확정 완료.

## 작업 트리

- holder: 비어 있음 — `feat/remove-gmail-jobkorea` code-review 완료(blocker 0, should-fix 2), 병합 준비
- branch: `chore/agent-workflow-setup` (9커밋, `main` 대상 클린 병합 확인, 사용자 병합 대기 — 변화 없음)
  - 위에 `feat/remove-gmail-jobkorea`(review 완료)와 `fix/session-refresh`(review 대기) 둘 다 신설
- base: `main` @ e2f979a

## 파이프라인

| topic | plan | design | implement | review | qa | merged |
|---|---|---|---|---|---|---|
| Day 1~7 (수집·매칭·리포트·스크래퍼) | done | – | done | – | done | ✅ |
| 배포 (my-claude-ruby.vercel.app) | done | – | – | – | – | ✅ |
| agent-workflow-setup | done | – | – | – | – | 병합 대기 |
| Gmail/잡코리아 제거 | done | – | done | 완료(blocker 0) | – | – |
| session-refresh 버그수정 (getClaims→getUser) | done | – | done | 대기 | – | – |
| redesign: design-system | – | – | – | – | – | – |
| redesign: screens | – | – | – | – | – | – |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- 사용자: `chore/agent-workflow-setup` 리뷰 → `git merge --no-ff` → push (새 병합 규약 첫 실행).
  `feat/remove-gmail-jobkorea`·`fix/session-refresh` 둘 다 이 브랜치 위에 얹혀 있어 순서상 먼저 필요.

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

- implement: `feat/remove-gmail-jobkorea` should-fix 2건 반영 (`server/scraping/common/browser.ts` 삭제,
  `rate-limit.ts`의 `MIN_DELAY_MS.jobkorea` 삭제) — 리뷰 문서: `artifacts/handover/2026-09-13-19-35-claude-review-remove-gmail-jobkorea.md`
- design: `artifacts/design/design-system.md` 정식 작성 → `feat/design-system`에서 Panda 도입
  (Pretendard 자체 호스팅 포함). 랜딩 화면 스펙은 작성 안 함.
- login 화면 스펙은 자동 로그인 방식 확정 후 작성 (그 전엔 스킵하고 dashboard/analysis 등 먼저 진행 가능).

## 참고

- 미실행 마이그레이션: `supabase/migrations/20260909075000_dedup_normalization.sql` (무해, 보류).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
