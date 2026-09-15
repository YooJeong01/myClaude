# 화면 리스타일 1차 라운드 리뷰 should-fix 반영 위임 (Codex)

- 2026-09-14 00:18
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: `artifacts/handover/2026-09-14-00-17-review-redesign-screens.md`가 정본. UTF-8로 읽어라.

## 작업 범위

리뷰 should-fix 4건, 전부 같은 브랜치(`feat/design-system`)에 이어서 커밋.

**T1.** `src/widgets/app-shell/ui/sidebar.tsx` — 초기 렌더 시 펼침→접힘 깜빡임. 서버는 뷰포트를
모르니, CSS 미디어쿼리 기반으로 초기 폭이 이미 맞게 나오도록 고쳐라(예: 사이드바 폭을 Panda 반응형
`w: { base: "sidebarCollapsed", md: "sidebarExpanded" }`로 CSS 레벨에서 처리하고, `collapsed` state는
사용자가 수동 토글했을 때만 그 CSS 기본값을 오버라이드하는 방식 — 정확한 구현 방식은 재량, 목표는
"360px에서 첫 페인트부터 접힌 상태로 보임, 깜빡임 없음").

**T2.** 같은 파일 — `matchMedia` 체크가 마운트 시 한 번만 실행되고 리스너가 없다.
`mql.addEventListener("change", handler)`(또는 동등한 resize 대응)를 추가해서 뷰포트 변화에 따라가게
해라. T1에서 CSS 기반으로 초기값을 처리하면 이 리스너는 "사용자가 수동 토글 안 했을 때만" 반응하게
설계해라(사용자가 직접 접었다 폈다 한 걸 리사이즈가 덮어쓰면 안 됨).

**T3.** `src/shared/ui/button.tsx`의 `size.icon` variant — 폭이 40px(`w:"10"`)라 44px 터치 타깃
기준에 못 미친다(높이는 base의 `minHeight:"touchTarget"`가 이미 적용돼 44px). `minWidth:
"touchTarget"`을 `icon` variant에 추가해라(`w`는 유지해도 되고 같이 `touchTarget`으로 맞춰도 됨 —
시각적으로 아이콘 버튼이 살짝 커지는 정도는 허용).

**T4.** `<aside>` → `Card`로 바뀌며 랜드마크가 사라진 2곳:
- `src/widgets/saved-calendar/ui/calendar-view.tsx`의 `SelectedPostingPanel`
- `app/(app)/dashboard/analyses/[id]/motivation/page.tsx`의 "분석 요약" 패널

`src/shared/ui/card.tsx`의 `Card`가 렌더 태그를 고를 수 있게 확장해라(예: `as` prop, 기본값 `"div"`,
이 두 곳에서 `as="aside"`로 호출). 다른 `Card` 사용처는 전부 그대로(`as` 생략 시 기존과 동일하게
`<div>`).

## 반드시 지킬 것

`.agents/workflow.md` §6. 추가로:
1. 같은 브랜치(`feat/design-system`)에 이어서 커밋, 새 브랜치 만들지 마라.
2. 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
3. **여전히 병합 요청하지 마라.**
4. 범위 넓히지 마라 (이 4건만).

## 완료 시 보고

`artifacts/handover/<ts>-codex-redesign-screens-review-fix-done.md`: 변경 파일, tsc/lint 결과,
커밋 해시.
