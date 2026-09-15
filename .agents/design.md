# 역할: design

## 한 줄

디자인 시스템(토큰·프리미티브·모션)과 화면별 시각 스펙. **노션(Notion)풍** — 미니멀·모노톤,
브랜드 컬러 없이 절제된 블루 accent만, 얇은 보더로 카드 구분, 폴더블 왼쪽 사이드바. 폰트는
프리텐다드(자체 호스팅). **스타일링은 Panda CSS 단독** (Tailwind·shadcn·Emotion 안 씀 —
Panda는 빌드타임 정적 추출이라 서버 컴포넌트와 마찰이 없고, 토큰·variant를 Panda 하나로 커버한다).
라이트+다크. **화면 파일(`src/features|widgets|views`, `app/**/page.tsx`)은 편집하지 않는다** —
스펙만 쓰고 implement가 적용.

## 실행

Claude 세션 (별도 터미널 또는 메인 세션 겸임) + `design` 스킬. **모델은 opus 권장** (시각 판단).
첫 동작: 이 문서 → `.agents/workflow.md` → `AGENTS.md` UTF-8로 읽기 + 현재 파운데이션 상태
(`src/app/globals.css`, `src/shared/ui/button.tsx`, `components.json`, `tailwind.config.ts` — 전부
**제거·교체 대상**, Panda 도입 전 마지막 상태) 파악.

## 소유 범위

- **W**: `artifacts/design/**` (design-system.md, screens/<screen>.md, mockups/).
- **W (리디자인 페이즈 한정)**: `panda.config.ts`(신규), `src/app/globals.css`(Panda 생성 CSS import로 교체),
  `src/shared/ui/**`(Panda/Park UI 기반으로 재작성), `src/shared/lib/utils.ts`의 `cn`(Panda `cx` 로 교체 여지).
  **제거**: `tailwind.config.ts`, `postcss.config.*`(tailwind 전용 부분), `components.json`, `tailwindcss-animate`
  의존성, 기존 `class-variance-authority` 기반 shadcn 코드.
- **R (편집 금지)**: `src/features|widgets|views/**`, `app/**/page.tsx` — 정확한 스펙을 쓰기 위해 읽는다.
- **관여 안 함**: `server/**`.

## 입력

사용자 시각 방향 (확정: 무드=노션풍 모노톤, 브랜드 컬러 없음(절제된 블루 accent만), 사이드바=폴더블,
폰트=프리텐다드, 다크모드=라이트+다크 둘 다, 스타일링=Panda CSS 단독, 토큰으로 나중에 색 교체
가능하게). **이 방향은 목업(1차 토스/카카오풍+초록) 을 실제로 본 뒤 사용자가 정정한 결과다** —
말로 들은 방향을 바로 코드/토큰으로 확정하지 말고, 목업으로 보여준 뒤 반응을 반영해라. 현재
`globals.css` + `button.tsx` + 화면 `className=` 인벤토리(교체 대상 파악용).

## 작업 순서

1. **목업 먼저.** `design` 스킬로 아트보드 3~5개(대시보드, 기업분석 리포트, 지원동기, 캘린더,
   로그인/랜딩). 사용자가 캔버스에서 다듬고 승인. 승인된 버전 링크를 `artifacts/design/mockups/README.md`.
2. `artifacts/design/design-system.md` 작성 (아래 형식). plan이 Panda config·FSD 실현성 검토.
3. `feat/design-system` 브랜치에 파운데이션 구현 — Tailwind·shadcn 제거, Panda 설치(`panda init`,
   `panda codegen`), `panda.config.ts`(토큰 + `dark` 컨디션 semantic token), `src/shared/ui/**` 프리미티브를
   Panda recipe(또는 Park UI에서 컴포넌트를 가져와) 로 재작성. 커밋마다 한글 메시지, `tsc` + `lint` 그린.
   → code-review → qa 스모크.
   **⚠️ 이 상태로 바로 사용자 병합하지 않는다.** Tailwind를 완전히 빼면 아직 리스타일 안 된 기존
   화면들(`className="..."` 유틸리티 클래스)이 전부 무스타일로 깨진다 — 이 상태가 `main`에 들어가서
   배포되면 라이브 프로덕션이 깨진다. **파운데이션과 화면 리스타일(T4·T5)을 같은 병합 단위로 묶어서,
   최소한 배포되는 화면들이 안 깨지는 지점까지 진행한 뒤에 사용자 병합을 요청한다.**
4. 화면별 `artifacts/design/screens/<screen>.md` 작성 (아래 형식). plan이 `artifacts/tasks/redesign.md`로 정리.
5. 화면 구현: implement가 파운데이션과 같은 브랜치 계열에서 이어서 적용(예: `feat/design-system`에서
   화면 태스크도 계속 커밋, 또는 그 브랜치에서 분기한 `feat/redesign-screens`를 화면 다 끝난 뒤에만
   병합). 화면 구현 중/후 design은 시각 결과만 검토하고 qa 리포트에 주석 — 화면 파일은 편집하지 않는다.
6. 전 화면(또는 최소 배포 대상 화면 전부)이 리스타일 완료 → code-review + qa 최종 확인 → **그제서야
   사용자 병합**.

## 디자인 스펙 형식

### `design-system.md` (리빙 스펙)

Panda의 `theme.tokens`(원시값) + `theme.semanticTokens`(의미 이름, `_dark` 컨디션으로 다크 재정의) 구조로
작성한다 — 컴포넌트는 원시값이 아니라 semantic token 이름을 참조해야 나중에 팔레트를 통째로 바꿀 수 있다.

- **색** — 그레이스케일 중심 원시 팔레트 + 절제된 블루 accent, 태그용 파스텔(gray/blue/green/yellow/red)과
  `background card border primary(거의 흑백) accent(블루) destructive` 같은 semantic token의 라이트/다크
  매핑. 대비비(AA) 명시. 값 초안은 `artifacts/design/mockups/` 목업 소스 참고.
- **타이포** — 프리텐다드(자체 호스팅, `public/fonts/` + `@font-face`), 타입 스케일(예:
  12/14/16/18/20/24/30/36), line-height, weight — Panda `textStyles`.
- **간격** — 스페이싱 스케일, 컨테이너 최대폭, 섹션 리듬 — Panda `spacing` 토큰.
- **radius** — radius 토큰(sm/md/lg) — 노션풍은 작게~중간(카드 10~14px, 버튼/인풋 8px), 태그·아바타만 pill/원형.
- **사이드바** — 폴더블(펼침/접힘) 상태 토큰: 폭(확장/축소), 라벨 표시 여부, 전환 duration.
- **elevation** — 그림자 토큰(얇고 낮게) — Panda `shadows`.
- **모션** — duration/easing 토큰, 등장·전환 패턴.
- **safe-area** — `env(safe-area-inset-*)` 토큰, `viewport-fit=cover` 전제.
- **터치 타깃** — 최소 44px, 간격 규칙, hover-only 인터랙션 제거 방침.
- **브레이크포인트** — 360 / 768 / 1280 — Panda `breakpoints`.
- **프리미티브 목록** — `button`(variant/size), `card`, `input`, `label`, `badge`, `separator`,
  `skeleton`, … 각 variant 표. Park UI에서 가져올지 직접 Panda recipe로 만들지 컴포넌트별 표시.

### `screens/<screen>.md` (화면 하나당)

- 어떤 인라인 블록을 어떤 프리미티브로 치환하는지 (파일:영역 → 프리미티브).
- 정확한 토큰/유틸리티 클래스.
- 360 / 768 / 1280 레이아웃.
- 다크모드 주의점.
- 상태(로딩/빈/에러/성공), 터치 타깃.

## 반드시 지킬 것 (workflow §6 + 아래)

- 화면 파일 편집 금지. 파운데이션도 `main` 병합은 사용자.
- 프리미티브는 Panda recipe 관례 (`cva`/`sva`, `styled-system/css`·`styled-system/recipes`에서 생성된 함수,
  `VariantProps` 대응) 로 작성. Park UI 컴포넌트를 가져오면 그 소스를 그대로 유지하고 토큰만 이 프로젝트
  것으로 맞춘다.
- Panda는 `panda codegen`으로 `styled-system/`을 생성한다 — 이건 빌드 산출물이라 `.gitignore` 처리하고
  `package.json`에 `postinstall`/`predev`로 codegen 연결.
- FSD: 프리미티브는 `src/shared/ui/`에만. 슬라이스 `index.ts` 공개 API.
- 프리텐다드는 Google Fonts에 없다 — `public/fonts/`에 woff2 파일 배치 + `@font-face`(라이선스 SIL OFL,
  상업적 사용 무료). 목업 캔버스에서 Noto Sans KR로 대체 표시했던 건 그 미리보기 환경의 제약일 뿐,
  실제 코드베이스엔 해당 안 됨.

## 출력

`artifacts/design/design-system.md`, `artifacts/design/screens/*.md`, `artifacts/design/mockups/README.md`,
`feat/design-system` 브랜치(파운데이션 코드).

## 후속

plan이 screens 스펙을 `artifacts/tasks/redesign.md` + 위임 문서로 정리 → implement가
`feat/redesign-screens`에서 화면 적용.
