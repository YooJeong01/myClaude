# 디자인 시스템 (리빙 스펙)

- 상태: **목업 v2 승인 대기.** 목업: https://claude.ai/code/artifact/5050b9ff-3403-4ca5-b667-5aa733b75f9b
  (2026-09-13, v1 토스/카카오풍+초록 → 사용자가 목업 보고 v2 노션풍으로 정정).
- 방향: **노션(Notion)풍** — 미니멀, 모노톤 위주(그레이스케일), 카드 구분은 얇은 보더(그림자 거의 안 씀),
  radius는 작게~중간(토스처럼 알약 모양까지는 안 감), 타이포 중심 위계. 라이트 + 다크 둘 다.
- **브랜드 컬러 없음.** Primary 액션(버튼)은 거의 흑백(라이트: 짙은 회흑 배경+흰 글자, 다크: 밝은
  회백 배경+짙은 글자). 인터랙션 강조(링크·포커스링·선택 상태)에만 절제된 블루 accent.
- **왼쪽 사이드바는 폴더블**(접기/펼치기) — 펼침 시 아이콘+라벨, 접힘 시 아이콘만. 목업에서 실제
  클릭 인터랙션으로 확인 가능.
- **폰트: 프리텐다드(Pretendard).** Google Fonts에 없어 자체 호스팅 필요 — `public/fonts/`에 파일
  배치 + `@font-face` 등록(Panda `globalCss` 또는 `globals.css`). 목업(Claude Design 캔버스)은 CSP상
  Google Fonts만 되어 Noto Sans KR로 대체 표시했을 뿐, 실제 구현엔 제약 없음.
- 스타일링: **Panda CSS 단독** (Tailwind·shadcn·Emotion 안 씀 — 이유는 `.agents/design.md` 참고).
  토큰은 원시값(`theme.tokens`)과 의미값(`theme.semanticTokens`, `_dark` 컨디션)으로 분리 —
  컴포넌트는 항상 semantic token 이름을 참조해서 나중에 팔레트 교체가 값 하나로 되게 한다.
- 형식 정의: `.agents/design.md` "디자인 스펙 형식" 참조.

## 색 (목업 기준, design-system.md 정식 값은 목업 승인 후 확정)

- semantic token — 라이트 / 다크:
  - `bg` `#FFFFFF` / `#191919`, `bgSidebar` `#F7F7F5` / `#202020`, `bgElevated`(카드) `#FFFFFF` / `#191919`
  - `surface`(hover·타일) `#F1F1EF` / `#242424`
  - `border` `#E9E9E7` / `#2F2F2F`, `borderStrong` `#DEDEDC` / `#3F3F3F`
  - `text` `#37352F` / `#E9E9E7`, `textMuted` `#787774` / `#9B9B99`, `textFaint` `#9B9A97` / `#6F6F6D`
  - `primary`(버튼bg) `#191919` / `#E9E9E7`, `primaryText` `#FFFFFF` / `#191919`
  - `activeBg`(사이드바 선택) `#EFEFEE` / `#2A2A2A`, `activeText` `#191919` / `#FFFFFF`
  - `link`(강조 액센트) `#0B6FC4` / `#4EA1F5`
  - 태그 팔레트(각 `{bg,text}`): `tagGray` `tagBlue` `tagGreen` `tagYellow` `tagRed` — 자유(신선함)·
    선택·경고·마감임박 등 의미별 배지에 사용. 값은 목업 소스(`artifacts/design/mockups/`) 참고.
- 대비비 AA 재검증 필요 (design 역할이 파운데이션 구현 시 확정).
- 현재값(제거·교체 대상): `src/app/globals.css`의 `:root` HSL 블록(블루 `221.2 83.2% 53.3%`),
  `tailwind.config.ts` 전체 — Panda 도입 시 제거.

## 타이포

- 폰트: 프리텐다드(자체 호스팅) — 한글+영문. 폴백 `'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`.
- 타입 스케일 / line-height / weight — 확정 필요.

## 간격 · radius · elevation · 모션

- 스페이싱 스케일, 컨테이너 최대폭.
- radius: 카드 10~14px, 버튼/인풋 8px, 태그·아바타는 pill(999px)/원형 — 노션풍은 토스만큼 안 둥글다.
- 그림자: 카드는 보더로만 구분, box-shadow 거의 안 씀. 팝오버/드롭다운 정도만 아주 옅게.
- duration/easing 토큰 — 사이드바 폭 전환(`flex-basis .15s ease`) 등.

## 반응형 · 앱 대응

- `env(safe-area-inset-*)` 토큰, `viewport-fit=cover`.
- 터치 타깃 ≥ 44px, hover-only 제거.
- 브레이크포인트 360 / 768 / 1280.
- 사이드바 폴더블 상태를 모바일 브레이크포인트에서 어떻게 다룰지(자동 접힘 등) 확정 필요.

## 프리미티브

| 컴포넌트 | 소스 | variant | size | 상태 |
|---|---|---|---|---|
| button | 기존 shadcn(제거 대상) → Panda/Park UI 재작성 | default(거의 흑백)·secondary·outline·ghost·link | +sm·default·lg·icon | 재작성 필요 |
| sidebar(폴더블) | 신규 | expanded/collapsed | – | 목업에 인터랙션 패턴 있음, 컴포넌트화 필요 |
| tag/badge | 신규 | gray·blue·green·yellow·red | sm | 신규 |
| card / input / label / separator / skeleton / … | Park UI 검토 | | | 미생성 |
