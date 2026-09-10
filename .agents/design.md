# 역할: design

## 한 줄

디자인 시스템(토큰·프리미티브·모션)과 화면별 시각 스펙. 토스풍 + shadcn(new-york) 기반, 라이트+다크.
**화면 파일(`src/features|widgets|views`, `app/**/page.tsx`)은 편집하지 않는다** — 스펙만 쓰고 implement가 적용.

## 실행

Claude 세션 (별도 터미널 또는 메인 세션 겸임) + `design` 스킬. **모델은 opus 권장** (시각 판단).
첫 동작: 이 문서 → `.agents/workflow.md` → `AGENTS.md` UTF-8로 읽기 + 현재 파운데이션 상태
(`src/app/globals.css`, `src/shared/ui/button.tsx`, `components.json`, `tailwind.config.ts`) 파악.

## 소유 범위

- **W**: `artifacts/design/**` (design-system.md, screens/<screen>.md, mockups/).
- **W (리디자인 페이즈 한정)**: `src/app/globals.css`, `tailwind.config.ts`, `postcss.config.*`,
  `src/shared/ui/**`, `src/shared/lib/utils.ts`의 `cn`.
- **R (편집 금지)**: `src/features|widgets|views/**`, `app/**/page.tsx` — 정확한 스펙을 쓰기 위해 읽는다.
- **관여 안 함**: `server/**`.

## 입력

사용자 시각 방향(무드=토스풍 확정, 레퍼런스 앱, 브랜드/primary 색, 다크모드=라이트+다크 확정).
현재 `globals.css` + `button.tsx` + 화면 `className=` 인벤토리.

## 작업 순서

1. **목업 먼저.** `design` 스킬로 아트보드 3~5개(대시보드, 기업분석 리포트, 지원동기, 캘린더,
   로그인/랜딩). 사용자가 캔버스에서 다듬고 승인. 승인된 버전 링크를 `artifacts/design/mockups/README.md`.
2. `artifacts/design/design-system.md` 작성 (아래 형식). plan이 Tailwind-config·FSD 실현성 검토.
3. `feat/design-system` 브랜치에 파운데이션 구현 — `globals.css`(`:root` + `.dark` 토큰), `tailwind.config.ts`
   매핑, `src/shared/ui/**` 프리미티브. 커밋마다 한글 메시지, `tsc` + `lint` 그린. → code-review → qa
   스모크 → plan 검증 → **사용자 병합**.
4. 화면별 `artifacts/design/screens/<screen>.md` 작성 (아래 형식). plan이 `artifacts/tasks/redesign.md`로 정리.
5. 화면 구현 중/후: 시각 결과만 검토하고 qa 리포트에 주석. 화면 파일은 편집하지 않는다.

## 디자인 스펙 형식

### `design-system.md` (리빙 스펙)

- **색** — `:root`(라이트) / `.dark` 각각 HSL 트리플: `background foreground card popover primary
  secondary muted accent destructive border input ring` + 필요시 성공/경고. 대비비(AA) 명시.
- **타이포** — 폰트 스택(한글 포함), 타입 스케일(예: 12/14/16/18/20/24/30/36), line-height, weight.
- **간격** — 스페이싱 스케일, 컨테이너 최대폭, 섹션 리듬.
- **radius** — `--radius` 및 lg/md/sm 파생.
- **elevation** — 그림자 토큰(토스풍은 얇고 낮게).
- **모션** — duration/easing 토큰, 등장·전환 패턴.
- **safe-area** — `env(safe-area-inset-*)` 토큰, `viewport-fit=cover` 전제.
- **터치 타깃** — 최소 44px, 간격 규칙, hover-only 인터랙션 제거 방침.
- **브레이크포인트** — 360 / 768 / 1280 각각의 레이아웃 원칙.
- **프리미티브 목록** — `button`(variant/size), `card`, `input`, `label`, `badge`, `separator`,
  `skeleton`, … 각 variant 표.

### `screens/<screen>.md` (화면 하나당)

- 어떤 인라인 블록을 어떤 프리미티브로 치환하는지 (파일:영역 → 프리미티브).
- 정확한 토큰/유틸리티 클래스.
- 360 / 768 / 1280 레이아웃.
- 다크모드 주의점.
- 상태(로딩/빈/에러/성공), 터치 타깃.

## 반드시 지킬 것 (workflow §6 + 아래)

- 화면 파일 편집 금지. 파운데이션도 `main` 병합은 사용자.
- 프리미티브는 shadcn new-york 관례 유지 (cva + `cn`, `VariantProps`, `asChild`/`Slot` 패턴 — `button.tsx` 참고).
- FSD: 프리미티브는 `src/shared/ui/`에만. 슬라이스 `index.ts` 공개 API.

## 출력

`artifacts/design/design-system.md`, `artifacts/design/screens/*.md`, `artifacts/design/mockups/README.md`,
`feat/design-system` 브랜치(파운데이션 코드).

## 후속

plan이 screens 스펙을 `artifacts/tasks/redesign.md` + 위임 문서로 정리 → implement가
`feat/redesign-screens`에서 화면 적용.
