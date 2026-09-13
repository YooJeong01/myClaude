# 상태 보드

- last update: 2026-09-13 (by plan) — 시각 방향·스타일링 스택 확정, 목업 착수 예정

## 현재 페이즈

**redesign — 목업 착수 직전.** 구조 세우기(`chore/agent-workflow-setup`) 병합 대기. 시각 방향 확정 완료.

## 작업 트리

- holder: (없음 — 사용자 병합 대기)
- branch: `chore/agent-workflow-setup` (5커밋, `main` 대상 클린 병합 확인)
- base: `main` @ e2f979a

## 파이프라인

| topic | plan | design | implement | review | qa | merged |
|---|---|---|---|---|---|---|
| Day 1~7 (수집·매칭·리포트·스크래퍼) | done | – | done | – | done | ✅ |
| 배포 (my-claude-ruby.vercel.app) | done | – | – | – | – | ✅ |
| agent-workflow-setup | done | – | – | – | – | 병합 대기 |
| redesign: design-system | – | – | – | – | – | – |
| redesign: screens | – | – | – | – | – | – |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- 사용자: `chore/agent-workflow-setup` 리뷰 → `git merge --no-ff` → push (새 병합 규약 첫 실행).

## 확정된 시각 방향 (참고: `project-design-stack-and-direction` 메모리)

- 무드: 토스/카카오풍 (알아보기 쉽고 둥근, 친근)
- 브랜드 컬러: 짙은 초록 계열, 자연/숲 팔레트
- 다크모드: 라이트 + 다크 둘 다
- 스타일링: **Panda CSS 단독** (Tailwind·shadcn·Emotion 제거/미사용, Park UI 컴포넌트 소스 검토)
- 토큰 우선 — 나중에 팔레트 통째로 교체 가능하게 semantic token으로

## 다음 액션

- plan/design: `design` 스킬로 아트보드 목업(대시보드·기업분석 리포트·지원동기·캘린더·로그인) 착수.

## 참고

- 미실행 마이그레이션: `supabase/migrations/20260909075000_dedup_normalization.sql` (무해, 보류).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
