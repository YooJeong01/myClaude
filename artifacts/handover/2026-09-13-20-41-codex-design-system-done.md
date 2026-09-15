# Panda CSS 파운데이션 완료 (Codex)

- 완료 시각: 2026-09-13 20:41
- 브랜치: `feat/design-system`

## 태스크별 변경

- T1 Tailwind·shadcn 제거:
  - 삭제: `tailwind.config.ts`, `components.json`
  - 수정: `package.json`, `pnpm-lock.yaml`
  - 제거 패키지: `tailwindcss`, `tailwindcss-animate`, `tailwind-merge`, `class-variance-authority`, `autoprefixer`
- T2 Panda CSS 설치 + 초기화:
  - 추가: `panda.config.ts`
  - 수정: `postcss.config.mjs`
  - `theme.tokens` + `theme.semanticTokens`에 라이트/다크 색, 태그 색, 타이포, radius, motion, safe-area, sidebar size, breakpoints 반영
  - dark 조건: `.dark &`
- T3 codegen 연결:
  - 수정: `package.json` (`postinstall`, `predev`, `prebuild` = `panda codegen && panda cssgen`)
  - 수정: `.gitignore` (`styled-system/`)
  - 수정: `eslint.config.mjs` (`styled-system/**` lint 제외)
- T4 globals.css 교체:
  - 수정: `src/app/globals.css` — Tailwind 지시어/HSL root 제거, `../../styled-system/styles.css` import, body Pretendard stack 적용
  - 수정: `app/layout.tsx` — `pretendard/dist/web/variable/pretendardvariable.css` import
- T5 프리미티브:
  - 수정: `src/shared/ui/button.tsx` — Panda `cva` recipe, variant `default|secondary|outline|ghost|link`, size `sm|default|lg|icon`, `asChild` 유지
  - 추가: `src/shared/ui/tag.tsx` — variant `gray|blue|green|yellow|red`, size `sm`
  - 추가: `src/shared/ui/card.tsx` — `bgElevated` + `border` + card radius
  - 수정: `src/shared/lib/utils.ts` — `tailwind-merge` 제거, Panda `cx` 기반
- T6 검증:
  - `pnpm panda codegen && pnpm panda cssgen`: 성공
  - `pnpm exec tsc --noEmit`: 성공
  - `pnpm lint`: 성공 (`eslint . && steiger ./src`, FSD 위반 0)
  - `pnpm dev`: 성공 (`http://localhost:3000`, Ready 확인 후 종료)
  - `pnpm build`: 성공

## 새 패키지

- `@pandacss/dev@0.54.0`
  - 참고: 최초 최신 `1.12.1` 설치 시 CLI가 `@clack/prompts` ESM/CJS 로딩 오류로 `styled-system/`을 생성하지 못해 `0.54.0`으로 고정.
- `pretendard@1.3.9`

## autoprefixer 판단

- 제거.
- 근거: Tailwind 전용 PostCSS 구성을 Panda PostCSS 플러그인으로 교체했고, CSS 산출은 `panda cssgen`에서 정상 생성됨. 현재 별도 autoprefixer 설정 의존이 없다.

## 커밋

- `e234f17` — `[chore] Panda CSS 파운데이션 설정`
- `a2f84b5` — `[feat] Panda 프리미티브 추가`

## 스펙 이탈 + 이유

- `@pandacss/dev` 최신 `1.12.1` 대신 `0.54.0` 사용.
- 이유: 이 환경의 Node/Windows/pnpm 조합에서 최신 CLI가 codegen 실행 시 ESM/CJS 로딩 오류를 내고 산출물을 만들지 못함. `0.54.0`은 `panda codegen`과 `panda cssgen` 모두 정상 동작.
- 추가 제거: `class-variance-authority`
- 이유: shadcn/CVA 기반 `button.tsx`를 Panda recipe로 치환해 더 이상 참조가 없음.

## 미해결·주의

- `styled-system/`은 생성됐지만 `.gitignore` 대상이라 커밋하지 않음. install/dev/build 훅에서 재생성된다.
- Tailwind를 제거했기 때문에 아직 리스타일하지 않은 기존 화면의 `className` 유틸리티 스타일은 무효화된다. 이번 범위에서는 정상 상태.
- 병합 보류 — 화면 리스타일과 묶어서 진행
