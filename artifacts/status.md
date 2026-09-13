# 상태 보드

- last update: 2026-09-14 08:20 (by plan) — 캘린더 iOS풍 작업은 다른 세션이 이어감, 이 세션은 손 뗌.
  종합 인수인계 문서 작성 완료.

**이 세션은 여기서 중단.** 캘린더 iOS풍 재작업(`artifacts/design/screens/calendar.md` "iOS 기본
캘린더풍 v2", 위임: `artifacts/handover/2026-09-14-08-10-claude-calendar-ios-delegation.md`)은
**사용자가 다른 세션에서 진행시킴 — 이 세션은 dispatch 안 함.** 전체 경위·결정·충돌 해결 과정은
`artifacts/handover/2026-09-14-08-04-claude-multiagent-redesign-handover.md` 참고 (다음 세션은
이 문서부터 읽을 것).

## 현재 페이즈

**redesign — 전체 화면 완료 상태에서 사이드바 버그 2차 수정 완료 + 캘린더 iOS풍 재작업 스펙 준비 중.**
⚠️ 이 브랜치는 병합 보류 — 전부 끝나야 병합 후보.

## 작업 트리

- holder: (비어 있음)
- branch: `main` @ a39901c 기준 `feat/design-system` (2026-09-13)
- base: `main` @ a39901c

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
| redesign: 캘린더 iOS풍 재작업 | – | 스펙 작성 중 | – | – | – | 보류 |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- (없음 — 사이드바 코드 수정 완료. **아직 병합 요청 안 함** — 위 경고 참조)

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

- plan/code-review/qa: 2차 라운드(T6~T10) + 사이드바 수정 결과 확인. tsc/lint는 Codex 기준 통과.
  실제 브라우저 육안 확인 필요(이번엔 특히 사이드바 폴딩 직접 눌러서 확인). Codex 환경에서는 Next dev
  `.next/trace` EPERM으로 실측 미검증. 완료:
  `artifacts/handover/2026-09-14-07-26-codex-sidebar-dynamic-css-fix-done.md`,
  `artifacts/handover/2026-09-14-08-15-codex-sidebar-toggle-fix-done.md`.
- 전체 완료되면: qa 라운드(E2E 회귀 + 반응형/다크) → 사용자에게 최종 병합 요청.
- 사용자 기상 후: 자동 로그인 방식(세션연장/체크박스/구글OAuth) 확인 필요 — login.md는 이미 작성됐지만
  OAuth 버튼은 그 결정 이후 별도 추가.

## 참고

- ~~미실행 마이그레이션~~ `supabase/migrations/20260909075000_dedup_normalization.sql` — 사용자가
  2026-09-14 실행 완료.
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에 실제로 발생
  (`feat/remove-gmail-jobkorea` 병합 시). 병합 직전엔 항상 이 파일을 수동으로 재작성해서 정리할 것 —
  자동 병합에 맡기지 말 것.
