# 인수인계 — 캘린더 iOS풍 작업 대기 (다른 세션이 진행)

- 2026-09-14 08:10
- 도구: claude (plan)
- 선행: `artifacts/handover/2026-09-10-00-34-claude-day7-완료-day8-대기.md`
- **전체 결정 경위·세션 간 충돌 해결·버그 히스토리는 여기 안 담음** — `artifacts/ai-notes/`의
  2026-09-14 파일 4개 참고(아래 "참고 문서" 목록). 이 문서는 다음 세션이 바로 이어서 할 수 있게
  **지시사항만** 담는다.

## 지금 상태

- `main`: 다중 에이전트 워크플로 + Gmail/잡코리아 제거 + session-refresh 버그수정 — 전부 병합·push 완료.
- `feat/design-system` (⚠️ 아직 `main`에 병합 안 함, 화면 전부 끝나야 병합):
  - Panda CSS 파운데이션(토큰·프리미티브) + should-fix 반영 완료.
  - 화면 11개 전체 리스타일(1·2차 라운드) + should-fix 반영 완료.
  - 사이드바 버그 2건(폴딩 안 됨 / 토글 접근 불가) 수정 완료.

## 다음 세션이 할 일 (순서대로)

1. **캘린더 iOS풍 재작업** — 사용자가 다른 세션에서 진행시키기로 함, **이 세션은 dispatch 안 하고
   멈춤.**
   - 스펙: `artifacts/design/screens/calendar.md`의 "iOS 기본 캘린더풍 v2" 절.
   - 위임 문서(그대로 Codex에 던지면 됨): `artifacts/handover/2026-09-14-08-10-claude-calendar-ios-delegation.md`.
   - 핵심: 오늘=원형 배지, 일정=점(dot). 툴바 chevron화는 우선순위 낮음.
2. 캘린더 작업 끝나면: `feat/design-system` 전체 code-review 재실행 + 브라우저 육안 확인(라이트/다크,
   360/768/1280, **사이드바 폴딩 직접 클릭 필수** — 지금까지 리뷰로 못 잡고 사용자 실기로만 잡힌
   버그가 2번 있었음) + qa 라운드(E2E 회귀) → 사용자에게 최종 병합 요청.
3. **미결 — 사용자 확인 필요**: 자동 로그인 방식(세션연장/체크박스/구글OAuth 중). `login.md` 스펙은
   이미 있지만 OAuth 버튼은 이 결정 이후 별도 추가.
4. **아직 코드로 안 옮김**: 랜딩 페이지 처리(`app/(marketing)/page.tsx` 제거 or `/login` 리다이렉트,
   `middleware.ts`의 미인증 리다이렉트 대상 `/`→`/login` 변경).
5. **Day 8**(Capacitor+Tauri, `artifacts/tasks/day8.md`)은 리디자인 전체 병합 후 착수 — 아직 시작 안 함.
6. ~~미실행 마이그레이션~~ `supabase/migrations/20260909075000_dedup_normalization.sql` — **사용자가
   2026-09-14 실행 완료.** 더 이상 미결 아님.

## 참고 문서

- `artifacts/status.md` — 항상 최신 상태 보드, 여기부터 볼 것.
- `artifacts/ai-notes/2026-09-14 다중 에이전트 워크플로 결정.md`
- `artifacts/ai-notes/2026-09-14 리디자인 방향 결정 히스토리.md`
- `artifacts/ai-notes/2026-09-14 세션 간 충돌 해결.md`
- `artifacts/ai-notes/2026-09-14 리디자인 버그 발견·수정 히스토리.md`
- `artifacts/design/screens/*.md` — 화면별 리스타일 스펙 11개(전부 작성 완료).
- `.agents/workflow.md` §6-11(Panda 동적값 금지), §7(Codex 중단 복구 순서).
