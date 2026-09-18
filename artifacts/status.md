# 상태 보드

- last update: 2026-09-18 (by plan) — **사용자 직접 지시로 `feat/screens-nit-cleanup` → `main`
  병합 완료**(충돌 0건). 병합 후 `tsc --noEmit` + `pnpm build` 재검증 통과. **push는 아직 안 함,
  사용자 확인 대기 중.**

## 현재 페이즈

**`main`에 리디자인(노션풍) + job-listing-filters + screens nit 정리까지 전부 반영 완료
(로컬 기준).** 원격(`origin/main`)엔 아직 push 안 함.

## 작업 트리

- holder: (empty)
- branch: `main` (병합 완료, push 대기).

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
| screens 2차 리뷰 nit 6건 정리 | done(위임) | – | done (`0cfd093`, tsc/lint/build 통과) | 완료(plan 직접 diff 리뷰, 우려사항 없음) | 대기(육안, 병합 비차단) | ✅ (`main`, 병합 완료, push 대기) |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- `main` push 여부 확인 필요 (아래 "다음 액션" 참고).

## 확정된 시각 방향 (참고: `project-design-stack-and-direction` 메모리)

- 무드: **노션(Notion)풍** — 미니멀·모노톤, 브랜드 컬러 없음, 절제된 블루 accent만.
- 사이드바: 폴더블(접기/펼치기). 폰트: 프리텐다드(자체 호스팅). 다크모드: 라이트+다크 둘 다.
- 스타일링: **Panda CSS 단독**. 토큰 우선 — 나중에 팔레트 통째로 교체 가능하게 semantic token으로.

## 사용자 결정 필요 (미확정 — 다음에 확인할 것)

- **자동 로그인 방식**: 세션 유지 연장 / "로그인 유지" 체크박스 / 구글 OAuth 원클릭 중 택1
  (Day 9 "Google OAuth 여부"와 동일 트랙). `login.md` 스펙 작성 전에 결정 필요.
- **Day 8(Capacitor + Tauri) 착수 여부** — `artifacts/tasks/day8.md` 작성만 되어 있고 미착수.

## 다음 액션

1. **`main` push 여부 사용자에게 확인.** push하면 병합된 `feat/screens-nit-cleanup` 로컬 브랜치
   정리(삭제)도 같이 할 것 — 지난 세션 패턴과 동일.
2. 위 1번과 무관하게, 사용자 편한 때 "사용자 결정 필요" 섹션 2건 확인.

## 참고

- job-listing-filters 마이그레이션 2건은 사용자가 Supabase에 적용 완료(2026-09-14).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build`·`pnpm start` 등 heavy 프로세스는 한 번에 1개만.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 병합 직전엔 항상
  이 파일을 수동으로 재작성해서 정리할 것 — 자동 병합에 맡기지 말 것.
