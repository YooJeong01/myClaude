# feat/design-system 리뷰 should-fix 반영 위임 (Codex)

- 2026-09-13 20:58
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: `artifacts/handover/2026-09-13-20-57-review-design-system.md`가 정본. UTF-8로 읽어라.

## 작업 범위

리뷰 should-fix 3건, 전부 같은 브랜치(`feat/design-system`)에 이어서 커밋.

**T1.** `panda.config.ts` — `borderStrong._dark`가 `{colors.gray875}`(`#2A2A2A`, `activeBg` dark와 겹침)로
잘못 참조하고 있다. `colors` 토큰에 `#3F3F3F` 값을 추가(이름은 기존 네이밍 규칙 따라 자유롭게, 예:
`gray925`)하고 `borderStrong._dark`가 그걸 참조하게 고쳐라.

**T2.** `panda.config.ts` — `textMuted._dark`가 `{colors.gray500}`(`#9B9A97`, `textFaint` light와 겹침)로
잘못 참조하고 있다. `colors` 토큰에 `#9B9B99` 값을 추가하고 `textMuted._dark`가 그걸 참조하게 고쳐라.

**T3.** `src/shared/ui/button.tsx` — `size.sm`의 `minHeight: "8"`가 base의 `minHeight: "touchTarget"`
(44px)를 덮어써서 44px 미만이 된다. `sm`에서 `minHeight` 오버라이드를 제거해라(`h: "8"`은 유지 — 시각적
높이만 작고, 클릭 가능 영역은 44px 유지).

## 반드시 지킬 것

`.agents/workflow.md` §6. 추가로:
1. 같은 브랜치(`feat/design-system`)에 이어서 커밋, 새 브랜치 만들지 마라.
2. 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
3. **여전히 병합 요청하지 마라** — 화면 리스타일과 묶어서 나중에.
4. 범위 넓히지 마라 (이 3건만).

## 완료 시 보고

`artifacts/handover/<ts>-codex-design-system-review-fix-done.md`: 변경 파일, tsc/lint 결과, 커밋 해시.
