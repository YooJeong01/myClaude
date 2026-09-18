# 상태 보드

- last update: 2026-09-15 23:05 (by plan) — Codex의 screens nit 6건 정리 완료(`0cfd093`).
  plan이 diff 직접 리뷰함(파일 12개 전부 확인) — 스펙대로 기계적 리팩터링만 수행, 동작 변경
  없음, 우려사항 없음. tsc/lint/build 전부 Codex 기준 통과. **`main` 병합은 사용자 확인 대기.**

## 현재 페이즈

**`main`은 리디자인(노션풍) + job-listing-filters 전체 반영 완료 상태(원격 동기화됨).**
`feat/screens-nit-cleanup`(nit 6건 정리)이 검증까지 끝나서 병합 후보 상태 — 사용자 확인만 남음.

## 작업 트리

- holder: (empty)
- branch: `feat/screens-nit-cleanup` — nit 6건 정리 완료(`0cfd093`), plan 리뷰 완료, 병합 후보.
- `main`: 병합·push 완료, 원격과 동기화됨.

## 파이프라인

| topic | plan | design | implement | review | qa | merged |
|---|---|---|---|---|---|---|
| Day 1~7 (수집·매칭·리포트·스크래퍼) | done | – | done | – | done | ✅ |
| 배포 (my-claude-ruby.vercel.app) | done | – | – | – | – | ✅ |
| agent-workflow-setup | done | – | – | – | – | ✅ |
| Gmail/잡코리아 제거 | done | – | done | 완료(blocker 0, should-fix 반영) | – | ✅ |
| session-refresh 버그수정 (getClaims→getUser) | done | – | done | 완료(blocker 0) | – | ✅ |
| redesign + job-listing-filters (파운데이션·화면 10개·사이드바·다크모드·캘린더·필터) | done | done | done | 완료(각 라운드 blocker 0) | 완료(육안 3라운드) | ✅ (`main`, `eee21de`) |
| career_level 백필 | done | – | done(dry-run+apply, 총 394건: 1차 376건 + 이번 18건) | – | – | ✅ (`main`) |
| screens 2차 리뷰 nit 6건 정리 | done(위임) | – | done (`0cfd093`, tsc/lint/build 통과) | 완료(plan 직접 diff 리뷰, 우려사항 없음) | 대기(육안, 병합 비차단) | 병합 후보(사용자 확인 대기) |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- `feat/screens-nit-cleanup`을 `main`에 병합할지 확인 필요(내용은 순수 스타일 리팩터링,
  기능 변경 없음 — 아래 "다음 액션" 참고).

## 확정된 시각 방향 (참고: `project-design-stack-and-direction` 메모리)

- 무드: **노션(Notion)풍** — 미니멀·모노톤, 브랜드 컬러 없음, 절제된 블루 accent만.
- 사이드바: 폴더블(접기/펼치기). 폰트: 프리텐다드(자체 호스팅). 다크모드: 라이트+다크 둘 다.
- 스타일링: **Panda CSS 단독**. 토큰 우선 — 나중에 팔레트 통째로 교체 가능하게 semantic token으로.

## 사용자 결정 필요 (미확정 — 다음에 확인할 것)

- **자동 로그인 방식**: 세션 유지 연장 / "로그인 유지" 체크박스 / 구글 OAuth 원클릭 중 택1
  (Day 9 "Google OAuth 여부"와 동일 트랙). `login.md` 스펙 작성 전에 결정 필요.
- **Day 8(Capacitor + Tauri) 착수 여부** — `artifacts/tasks/day8.md` 작성만 되어 있고 미착수.

## 다음 액션

1. `feat/screens-nit-cleanup`을 `main`으로 병합할지 **사용자에게 물어볼 것**(충돌 위험 없음 —
   `main`이 이 브랜치의 base에서 안 움직임). 병합 명령어:
   ```
   git checkout main && git merge --no-ff feat/screens-nit-cleanup
   ```
2. 위 1번과 무관하게, 사용자 편한 때 "사용자 결정 필요" 섹션 2건 확인.

## 참고

- job-listing-filters 마이그레이션 2건은 사용자가 Supabase에 적용 완료(2026-09-14).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build`·`pnpm start` 등 heavy 프로세스는 한 번에 1개만.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 병합 직전엔 항상
  이 파일을 수동으로 재작성해서 정리할 것 — 자동 병합에 맡기지 말 것.
