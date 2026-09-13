# 상태 보드

- last update: 2026-09-14 00:25 (by plan) — 야간 자율 세션: 2차 라운드 스펙(전체 11화면 완료) + Codex 위임

**야간 자율 세션 진행 중** — 사용자가 잠든 사이 plan이 남은 화면 스펙(login·experiences·
analyses-index·job-postings·analysis-history) 전부 작성 완료하고 Codex에게 구현 위임함. 위임 문서:
`artifacts/handover/2026-09-14-00-25-claude-redesign-screens-round2-delegation.md`.

## 현재 페이즈

**redesign — 전체 11개 화면 스펙 작성 완료, 2차 라운드(5화면) 구현 진행 중.** ⚠️ 이 브랜치는 2차
라운드가 끝나도 병합 보류 — 사용자가 깨어나서 최종 검증·리뷰·병합 승인해야 한다.

## 작업 트리

- holder: implement (codex) — 2차 라운드 T6~T10
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
| redesign: screens 2차(login·experiences·analyses-index·job-postings·analysis-history) | done | done(스펙 5개, T6~T10) | 진행중 (Codex, 야간) | – | – | 보류 |
| Day 8 (Capacitor + Tauri) | 대기 (day8.md 작성됨) | – | – | – | – | – |

## 블로킹 / 사용자 대기

- (없음 — Codex가 2차 라운드(T6~T10) 진행 중. 자는 동안 막히는 태스크는 blocked 문서 남기고 다음
  태스크로 넘어가도록 지시해둠. **아직 병합 요청 안 함** — 위 경고 참조)

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

- implement(Codex): 2차 라운드(T6~T10) 진행 중, 야간 자율.
- 완료(또는 부분 완료)되면: plan이 tsc/lint 재확인 + code-review + 이어서 육안 확인.
- 전체 완료되면: qa 라운드(E2E 회귀 + 반응형/다크) → 사용자에게 최종 병합 요청.
- 사용자 기상 후: 자동 로그인 방식(세션연장/체크박스/구글OAuth) 확인 필요 — login.md는 이미 작성됐지만
  OAuth 버튼은 그 결정 이후 별도 추가.

## 참고

- 미실행 마이그레이션: `supabase/migrations/20260909075000_dedup_normalization.sql` (무해, 보류).
- 호스트 RAM ~1GB — `codex exec`·`pnpm build` OOM 빈번. heavy 프로세스 1개씩.
- **교훈**: `status.md`가 브랜치마다 갈라져 있으면 병합 시 거의 항상 충돌한다. 이번에 실제로 발생
  (`feat/remove-gmail-jobkorea` 병합 시). 병합 직전엔 항상 이 파일을 수동으로 재작성해서 정리할 것 —
  자동 병합에 맡기지 말 것.
