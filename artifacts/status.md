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

- 무드: **노션(Notion)풍** — 미니멀·모노톤, 브랜드 컬러 없음, 절제된 블루 accent만.
  (1차 토스/카카오풍+짙은 초록 목업을 본 뒤 사용자가 정정 — 2026-09-13 v2)
- 사이드바: 폴더블(접기/펼치기) — 목업에서 실제 클릭 인터랙션으로 구현됨.
- 폰트: 프리텐다드(자체 호스팅 필요). 목업 캔버스는 Google Fonts 제약으로 Noto Sans KR 대체 표시.
- 다크모드: 라이트 + 다크 둘 다
- 스타일링: **Panda CSS 단독** (Tailwind·shadcn·Emotion 제거/미사용, Park UI 컴포넌트 소스 검토)
- 토큰 우선 — 나중에 팔레트 통째로 교체 가능하게 semantic token으로

## 다음 액션

- 사용자: 목업 v2 방향 확인 + "이후 컴포넌트별 세부 조정" 라운드 필요하면 지시
  (`artifacts/design/mockups/README.md` 링크, 캔버스에서 직접 다듬기도 가능).
- 승인 후 design: `artifacts/design/design-system.md` 정식 작성 → `feat/design-system`에서 Panda 도입
  (Pretendard 자체 호스팅 포함).

## 참고

- 미실행 마이그레이션: `supabase/migrations/20260909075000_dedup_normalization.sql` (무해, 보류).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
