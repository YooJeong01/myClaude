# 상태 보드

- last update: 2026-09-13 20:58 (by plan) — 파운데이션 리뷰 완료(should-fix 3건), Codex가 반영 중

## 현재 페이즈

**redesign — Panda CSS 파운데이션 구현 완료, review 대기.** ⚠️ 이 브랜치는 완료돼도 화면 리스타일과 묶어서
병합할 때까지 main 병합 보류 (Tailwind 제거로 기존 화면이 일시적으로 무스타일이 되기 때문 —
`.agents/design.md`, 이 브랜치 위임 문서 참조).

## 작업 트리

- holder: implement (codex) — should-fix 3건 반영 중
- branch: `main` @ a39901c 기준 `feat/design-system` 신설 (2026-09-13)
- base: `main` @ a39901c

## 파이프라인

| topic | plan | design | implement | review | qa | merged |
|---|---|---|---|---|---|---|
| Day 1~7 (수집·매칭·리포트·스크래퍼) | done | – | done | – | done | ✅ |
| 배포 (my-claude-ruby.vercel.app) | done | – | – | – | – | ✅ |
| agent-workflow-setup | done | – | – | – | – | ✅ |
| Gmail/잡코리아 제거 | done | – | done | 완료(blocker 0, should-fix 반영) | – | ✅ |
| session-refresh 버그수정 (getClaims→getUser) | done | – | done | 완료(blocker 0) | – | ✅ |
| redesign: design-system (파운데이션) | done | done(스펙) | should-fix 3건 반영 중 (Codex) | 완료(blocker 0, should-fix 3) | – | 보류(화면과 묶어서) |
| redesign: screens | done(README 목록) | 진행 필요 | – | – | – | – |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- (없음 — Codex가 리뷰 should-fix 반영 중. **이 브랜치는 완료돼도 아직 병합 요청 안 함** — 위 경고 참조)

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

- code-review: `feat/design-system` 파운데이션 커밋 리뷰. 완료 문서:
  `artifacts/handover/2026-09-13-20-41-codex-design-system-done.md`.
- 이후: design이 화면별 `screens/<screen>.md` 스펙 작성 → implement가 같은 브랜치
  계열에서 화면까지 적용 → 그제서야 사용자 병합 (파운데이션 단독 병합 안 함).
- login 화면 스펙은 자동 로그인 방식 확정 후 작성 (그 전엔 스킵하고 dashboard/analysis 등 먼저 진행 가능).

## 참고

- 미실행 마이그레이션: `supabase/migrations/20260909075000_dedup_normalization.sql` (무해, 보류).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에 실제로 발생
  (`feat/remove-gmail-jobkorea` 병합 시). 병합 직전엔 항상 이 파일을 수동으로 재작성해서 정리할 것 —
  자동 병합에 맡기지 말 것.
