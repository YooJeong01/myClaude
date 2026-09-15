# 화면 리스타일 1차 라운드 위임 (Codex)

- 2026-09-13 21:10
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/tasks/redesign.md`가 정본** (T1~T5, 의존성 순서). 각 T##가 가리키는
  `artifacts/design/screens/<screen>.md`를 UTF-8로 읽어라 (`Get-Content -LiteralPath ...
  -Encoding UTF8`). `.agents/implement.md`, `.agents/workflow.md`, `AGENTS.md`도 같은 방식으로 읽어라.

## 상황

Panda CSS 파운데이션(`feat/design-system`)은 이미 이 브랜치에 들어가 있다(토큰, `Button`/`Tag`/`Card`
프리미티브). 이번 위임은 그 토큰·프리미티브를 실제 화면 5개에 적용하는 것 — **같은 브랜치에 이어서
커밋해라, 새 브랜치 만들지 마라.**

## 작업 범위

`artifacts/tasks/redesign.md`의 T1~T5 그대로. 요약:

1. **T1 app-shell** (선행 필수) — 신규 `app/(app)/layout.tsx` + 신규
   `src/widgets/app-shell/ui/sidebar.tsx`(`"use client"`, 폴더블). 스펙: `screens/app-shell.md`.
   FSD: `widgets`가 `app` layout에서 쓰이는 건 정상(위→아래 소비 방향).
2. **T2 dashboard** — `src/views/dashboard/index.tsx`. 스펙: `screens/dashboard.md`.
3. **T3 analysis-detail** — `company-analysis-report/ui/{report,sources,mirrored-report}.tsx`.
   스펙: `screens/analysis-detail.md`. `mirrored-report.tsx`는 스펙에 명시된 대로 `report.tsx`와
   동일 패턴 적용(정확한 매핑은 실제 파일 보고 판단).
4. **T4 motivation** — `analyses/[id]/motivation/page.tsx`, `run-motivation/ui/experience-picker.tsx`,
   `drafts/[id]/page.tsx`(파일 없으면 실제 경로 확인), `motivation-result/ui/{result,mirrored-result}.tsx`.
   스펙: `screens/motivation.md`.
5. **T5 calendar** — `calendar/page.tsx`, `saved-calendar/ui/calendar-view.tsx`,
   `src/app/globals.css`(react-big-calendar `.rbc-*` 오버라이드). 스펙: `screens/calendar.md`.

## 반드시 지킬 것

`.agents/workflow.md` §6 전체. 추가로:
1. 같은 브랜치(`feat/design-system`)에 이어서, **T##마다 커밋**, `[feat]` 한글 메시지.
2. 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
3. **여전히 병합 요청하지 마라.** 이번 라운드 끝나도 다른 화면(experiences/analyses-index/login/
   job-postings)이 아직 무스타일이라 배포 불가 상태 그대로다.
4. 스펙에 없는 새 프리미티브가 필요하면(예: input 컴포넌트) — 간단한 거면 `src/shared/ui/`에 스펙의
   기존 프리미티브(button/tag/card) 패턴 그대로 만들어서 써라(체크박스처럼 네이티브 엘리먼트로 충분한
   건 새로 안 만듦, 스펙에 명시돼 있다). 애매하면 멈추고 blocked 문서.
5. `react-big-calendar` 오버라이드에서 Panda 토큰을 CSS 변수로 참조할 수 있으면 그렇게(다크모드 자동
   대응), 안 되면 라이트/다크 값을 `.dark .rbc-...`로 각각 명시.
6. `pnpm dev` 띄워서 5개 화면 육아 확인은 못 하더라도 최소 에러 없이 뜨는지, tsc/lint 통과로 대체
   가능 — 스크린샷/육안 확인은 plan이 나중에 한다.

## 완료 시 보고

`artifacts/handover/<ts>-codex-redesign-screens-done.md`:
- T##별 생성/수정 파일
- tsc/lint 결과 (T##별 또는 최종)
- `pnpm dev` 부팅 확인 여부
- react-big-calendar 오버라이드에서 CSS 변수 참조 vs 하드코딩 중 어느 쪽으로 갔는지 + 이유
- 새로 만든 프리미티브가 있으면 목록
- **"병합 보류 — 남은 화면과 묶어서 진행"** 명시
- 커밋 해시 목록, 스펙 이탈 + 이유, 미해결·주의
