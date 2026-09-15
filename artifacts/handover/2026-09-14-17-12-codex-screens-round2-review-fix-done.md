# screens 2차 code-review should-fix 4건 반영 완료 (Codex)

- 완료 시각: 2026-09-14 17:12
- 브랜치: `feat/design-system`
- 적용 커밋: `3408578` (`[fix] screens 2차 리뷰 should-fix 반영`)
- main 병합/push: 하지 않음

## 변경 파일

- `src/shared/ui/card.tsx`
- `src/features/add-job-posting/ui/form.tsx`
- `app/(app)/dashboard/analyses/page.tsx`
- `app/(app)/dashboard/experiences/page.tsx`
- `panda.config.ts`
- `src/features/auth/ui/login-form.tsx`
- `src/features/manage-experience/ui/experience-form.tsx`
- `src/features/manage-experience/ui/experience-list.tsx`
- `src/features/toggle-saved-posting/ui/save-toggle.tsx`

## should-fix 4건 적용 방식

- 1. URL로 채우기 패널 배경: `Card`에 `variant="surface"` 추가. 기본 `cardStyle`에서 배경을 분리해 한 요소에 `bgElevated`와 `surface`가 동시에 붙지 않게 수정.
- 2. 페이지 max-width 복원: `/dashboard/analyses`는 `maxW: "1152px"`, `/dashboard/experiences`는 `maxW: "1024px"` + `mx: "auto"` + `w: "full"` 적용.
- 3. experiences 이메일 표시: 권장안 (a) 적용. 페이지 헤더에 `{user.email ?? "로그인 사용자"}` 표시를 복원.
- 4. 에러 메시지 색상: `dangerText` semantic token 추가(라이트 `#C0392B`, 다크 `#FF6B6B`) 후 일반 에러 텍스트 사용처를 `tagRed.text`에서 교체. `Tag`의 red variant는 배지 용도라 유지.

## 검증

- `pnpm exec panda codegen`: 통과
- `pnpm exec panda cssgen`: 통과
- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 통과 (`eslint . && steiger ./src`, 문제 없음)
- `pnpm build`: 통과
- dev 서버 기동: `http://localhost:3000` Ready 확인
- 브라우저 육안 확인: 미확인. Browser plugin 런타임은 초기화됐지만 `agent.browsers.list()`가 `[]`를 반환해 현재 세션에서 사용 가능한 브라우저가 없었음. 코드/생성 CSS 근거로는 4건 모두 반영 확인.

## 미해결/주의

- 작업 전부터 있던 미추적 `.claude/settings.local.json`은 건드리지 않음.
- 새 패키지/env/마이그레이션 없음.
