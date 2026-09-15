# 화면 리스타일 2차 라운드 완료 (Codex)

- 완료 시각: 2026-09-14 01:20
- 브랜치: `feat/design-system`
- 범위: `artifacts/tasks/redesign.md` 2차 라운드 T6~T10
- 병합 보류 — 사용자 기상 후 최종 검증·리뷰 필요

## T6 experiences

- 생성: `src/shared/ui/input.tsx`, `src/shared/ui/textarea.tsx`
- 수정: `app/(app)/dashboard/experiences/page.tsx`, `src/features/manage-experience/ui/experience-form.tsx`, `src/features/manage-experience/ui/experience-list.tsx`
- 결과: 완료
- 검증: `pnpm exec tsc --noEmit` 통과, `pnpm lint` 통과
- 커밋: `621c61c` `[feat] 경험 관리 화면 리스타일`

## T7 login

- 수정: `app/login/page.tsx`, `src/features/auth/ui/login-form.tsx`
- 결과: 완료
- 검증: `pnpm exec tsc --noEmit` 통과, `pnpm lint` 통과
- 커밋: `feef154` `[feat] 로그인 화면 리스타일`
- 스펙 이탈: 없음. OAuth 버튼은 스펙대로 미추가.

## T8 analyses-index

- 수정: `app/(app)/dashboard/analyses/page.tsx`
- 결과: 완료
- 검증: `pnpm exec tsc --noEmit` 통과, `pnpm lint` 통과
- 커밋: `5bd340c` `[feat] 기업분석 목록 화면 리스타일`

## T9 job-postings

- 수정: `src/features/add-job-posting/ui/form.tsx`, `src/features/search-job-postings/ui/filter-form.tsx`, `src/features/toggle-saved-posting/ui/save-toggle.tsx`, `src/features/run-analysis/ui/run-analysis-button.tsx`
- 결과: 완료
- 검증: `pnpm exec tsc --noEmit` 통과, `pnpm lint` 통과
- 커밋: `b2f42d7` `[feat] 공고 입력 검색 위젯 리스타일`

## T10 analysis-history

- 수정: `src/widgets/analysis-history/ui/history-list.tsx`, `src/widgets/analysis-history/ui/freshness-badge.tsx`
- 결과: 완료
- 검증: `pnpm exec tsc --noEmit` 통과, `pnpm lint` 통과
- 커밋: `0ef20fd` `[feat] 분석 이력 위젯 리스타일`

## 새 프리미티브 요약

- `Input`: `bg`, `border`, `input` radius, `text`/`textFaint`, `link` focus ring, disabled opacity/cursor.
- `Textarea`: `Input`과 같은 톤, `py: 2`, `resize: vertical`, 호출부에서 `minH` 오버라이드.
- `<select>`: 별도 컴포넌트 없이 `inputStyle`을 `cn(inputStyle, css(...))`로 재사용.

## 미해결·주의

- blocked 없음.
- 새 패키지 없음.
- `pnpm dev` 육안 확인은 미실행. 야간 구현 세션에서는 태스크별 `tsc`/`lint` 게이트만 확인.
- `pnpm build` 미실행 — RAM 제약상 이번 위임의 필수 게이트가 아님.
- `.claude/settings.local.json`은 시작 전부터 untracked였고 건드리지 않음.
