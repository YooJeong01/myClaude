# Panda CSS 파운데이션 위임 (Codex)

- 2026-09-13 20:21
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/design/design-system.md`가 정본.** 먼저 UTF-8로 읽어라
  (`Get-Content -LiteralPath ... -Encoding UTF8`). `.agents/design.md`, `.agents/implement.md`,
  `.agents/workflow.md`, `AGENTS.md`도 같은 방식으로 읽어라.
- 목업(참고용, 실제 화면은 이번 범위 아님): https://claude.ai/code/artifact/5050b9ff-3403-4ca5-b667-5aa733b75f9b

## 상황

리디자인 방향(노션풍 모노톤, Panda CSS 단독, 프리텐다드)이 확정됐다. 이번 위임은 **디자인 시스템
파운데이션만** — 토큰·프리미티브 몇 개. 화면 리스타일은 다음 위임(`feat/redesign-screens` 계열)에서.

**⚠️ 중요 — 병합 보류**: Tailwind를 완전히 제거하면 아직 안 고친 기존 화면(`app/**`, `src/views|widgets|
features/**`)의 `className="..."` 유틸리티 클래스가 전부 무효화돼 무스타일로 보인다. **이 브랜치
(`feat/design-system`)는 이 태스크가 끝나도 바로 병합 요청하지 마라.** `pnpm dev`로 띄웠을 때 기존
화면들이 레이아웃 깨진 채(무스타일) 보이는 건 **이번 태스크 범위에서는 정상**이다 — plan이 이후 화면
리스타일까지 같은 병합 단위로 묶어서 준비되면 그때 사용자 병합을 요청한다. done 문서에도 이 사실을
명시해라 (다음 세션이 "왜 화면이 깨졌지" 하고 혼란스러워하지 않게).

## 작업 범위 (의존성 순서)

**T1. Tailwind·shadcn 제거**
- 삭제: `tailwind.config.ts`, `components.json`.
- `package.json`에서 제거: `tailwindcss`, `tailwindcss-animate`, `tailwind-merge`.
  `autoprefixer`는 유지 여부를 Panda postcss 플러그인 구성 보고 판단(Panda가 자체 처리하면 제거,
  아니면 유지) — done 문서에 어느 쪽인지 명시.
- `postcss.config.mjs`는 T2에서 Panda용으로 교체.

**T2. Panda CSS 설치 + 초기화**
- `pnpm add -D @pandacss/dev`, `pnpm panda init --postcss` (또는 동등 명령).
- `panda.config.ts` 작성 — `artifacts/design/design-system.md` "색"/"타이포"/"간격 · radius · elevation
  · 모션"/"반응형" 섹션 값을 그대로 옮긴다:
  - `theme.tokens` (원시값) + `theme.semanticTokens`(`_dark` 컨디션으로 다크 재정의) — 색 섹션의
    라이트/다크 쌍 전부(`bg`, `bgSidebar`, `bgElevated`, `surface`, `border`, `borderStrong`, `text`,
    `textMuted`, `textFaint`, `primary`, `primaryText`, `activeBg`, `activeText`, `link`,
    `tagGray/Blue/Green/Yellow/Red` 각 `{bg,text}`).
  - `theme.breakpoints`: 360 / 768 / 1280 대응 커스텀 이름 정의.
  - `theme.radii`: 카드 10~14px, 버튼/인풋 8px, pill 999px.
  - preflight: true. jsxFramework 지정 안 함(프레임워크 무관 `css`/`cva` 함수만 사용).
  - dark mode 전략: class 기반(`.dark` 상위 selector).

**T3. codegen 연결**
- `package.json` scripts에 codegen 훅 추가(`postinstall` 또는 `predev`/`prebuild` — 관례에 맞는 걸로).
- `.gitignore`에 `styled-system/` 추가 (빌드 산출물, 커밋 안 함).
- `panda codegen` 1회 실행해서 정상 생성 확인.

**T4. `globals.css` 교체**
- 기존 `@tailwind base/components/utilities` + `:root` HSL 블록 전부 제거.
- Panda 생성 CSS(`styled-system/styles.css`) import.
- 프리텐다드: `pnpm add pretendard`, `app/layout.tsx`에서
  `import "pretendard/dist/web/variable/pretendardvariable.css"` (바이너리 파일을 직접 구하거나
  `public/fonts/`에 수동 배치하지 마라 — npm 패키지로 해결한다).
- body 기본 폰트 스택: `'Pretendard Variable', 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`.

**T5. 프리미티브 재작성 (`src/shared/ui/`)**
- `button.tsx`: Panda recipe 기반으로 재작성. variant: `default`(거의 흑백)·`secondary`·`outline`·
  `ghost`·`link`. size: `sm`·`default`·`lg`·`icon`. `asChild`(`@radix-ui/react-slot`)는 그대로 유지.
- 신규 `tag.tsx`(badge): variant `gray`·`blue`·`green`·`yellow`·`red`, size `sm`.
- 신규 `card.tsx`: `bgElevated` + `border` 컨테이너, radius 카드 토큰.
- **이 3개만.** input/label/separator/skeleton/sidebar 등 나머지는 화면 작업 때 필요한 시점에 추가 —
  지금 범위 아님. Park UI 도입도 이번 범위 아님(나중에 화면 작업에서 필요하면 별도 검토).
- `src/shared/lib/utils.ts`의 `cn()`: `tailwind-merge` 의존 제거. Panda 생성 `cx`(`styled-system/css`에서
  export)로 교체하거나, 단순 `clsx`만으로 충분하면 그렇게.

**T6. 검증**
- `pnpm exec tsc --noEmit`, `pnpm lint`(eslint + steiger — FSD 위반 0).
- `pnpm dev` 부팅 확인 — 에러 없이 뜨는지만 확인(화면이 무스타일인 건 위 경고대로 정상).
- `pnpm build`는 RAM 되면 시도, 안 되면 done 문서에 "미검증 — RAM" 명시.

## 레퍼런스

- `src/shared/ui/button.tsx` — 현재 shadcn 버전(cva + `cn` + `Slot` 패턴) — 이 구조를 Panda recipe로
  치환할 때 형태(`forwardRef`, `ButtonProps`, `buttonVariants` export 등) 유지.
- Panda CSS 공식 문서의 `recipes`/`cva` 패턴, `theme.semanticTokens`의 `_dark` 컨디션 예시.

## 반드시 지킬 것

`.agents/workflow.md` §6 전체 적용. 추가로:
1. 브랜치는 이미 파둔 `feat/design-system` 그대로 사용.
2. **완료돼도 병합 요청하지 마라** (위 경고 참조). done 문서 끝에 "병합 보류 — 화면 리스타일과 묶어서
   진행" 한 줄 남겨라.
3. 화면 파일(`app/**`, `src/features|widgets|views/**`)은 건드리지 마라 — 무스타일로 보이는 게 맞다.
4. 새 패키지: `@pandacss/dev`, `pretendard` 두 개만 추가 승인됨. 그 외 필요하면(예: Park UI, Ark UI)
   멈추고 blocked 문서.
5. 태스크(T1~T6)별로 커밋, `[feat]`/`[chore]` 한글 메시지.

## 완료 시 보고

`artifacts/handover/<ts>-codex-design-system-done.md`:
- 태스크별 생성/수정/삭제 파일
- 새 패키지 (`@pandacss/dev`, `pretendard`) + `autoprefixer` 유지/제거 판단 근거
- tsc/lint/dev부팅/build 결과
- **"병합 보류 — 화면 리스타일과 묶어서 진행"** 명시
- 커밋 해시 목록
- 스펙 이탈 + 이유, 미해결·주의
