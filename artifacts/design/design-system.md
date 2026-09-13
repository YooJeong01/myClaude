# 디자인 시스템 (리빙 스펙)

- 상태: **스켈레톤 — 미작성.** design 역할이 목업 승인 후 채운다.
- 방향: 토스/카카오풍(알아보기 쉽고 둥근, 친근, 낮은 elevation, 넉넉한 간격) + **짙은 초록 계열
  자연·숲 팔레트**. 라이트 + 다크 둘 다.
- 스타일링: **Panda CSS 단독** (Tailwind·shadcn·Emotion 안 씀 — 이유는 `.agents/design.md` 참고).
  토큰은 원시값(`theme.tokens`)과 의미값(`theme.semanticTokens`, `_dark` 컨디션)으로 분리 —
  컴포넌트는 항상 semantic token 이름을 참조해서 나중에 팔레트 교체가 값 하나로 되게 한다.
- 형식 정의: `.agents/design.md` "디자인 스펙 형식" 참조.

## 색

- 원시 팔레트: 짙은 초록 메인 스케일 + 자연/숲 보조색(예: 흙색·베이지·연둣빛 포인트) 단계별.
- semantic token: `background foreground card primary secondary muted accent destructive border
  input ring` (+ 성공/경고 필요시) — 라이트/다크 각각 매핑. 대비비 AA 명시.
- 현재값(제거·교체 대상): `src/app/globals.css`의 `:root` HSL 블록 — primary `221.2 83.2% 53.3%`(블루),
  radius `0.5rem`, `.dark` 블록 없음. `tailwind.config.ts`도 Panda 도입 시 제거.

## 타이포

- 폰트 스택 (한글 포함 — 현재 `Arial, Helvetica, sans-serif` 교체).
- 타입 스케일 / line-height / weight.

## 간격 · radius · elevation · 모션

- 스페이싱 스케일, 컨테이너 최대폭.
- radius 토큰 — 토스/카카오풍은 넉넉하게 둥글게.
- 그림자 토큰 (얇고 낮게).
- duration/easing 토큰.

## 반응형 · 앱 대응

- `env(safe-area-inset-*)` 토큰, `viewport-fit=cover`.
- 터치 타깃 ≥ 44px, hover-only 제거.
- 브레이크포인트 360 / 768 / 1280.

## 프리미티브

| 컴포넌트 | 소스 | variant | size | 상태 |
|---|---|---|---|---|
| button | 기존 shadcn(제거 대상) → Panda/Park UI 재작성 | default·secondary 현재 → +outline·ghost·destructive·link | +sm·default·lg·icon | 재작성 필요 |
| card / input / label / badge / separator / skeleton / … | Park UI 검토 | | | 미생성 |
