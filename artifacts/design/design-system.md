# 디자인 시스템 (리빙 스펙)

- 상태: **스켈레톤 — 미작성.** design 역할이 목업 승인 후 채운다.
- 방향: 토스풍(밝고 친근, 낮은 elevation, 넉넉한 간격, 둥근 radius) + shadcn new-york 기반. 라이트 + 다크.
- 형식 정의: `.agents/design.md` "디자인 스펙 형식" 참조.

## 색

- `:root` (라이트) — background / foreground / card / popover / primary / secondary / muted / accent /
  destructive / border / input / ring (+ 성공·경고 필요시). HSL 트리플. 대비비 AA 명시.
- `.dark` — 위 토큰 전부 재정의.
- 현재값(교체 대상): `src/app/globals.css`의 `:root` 블록 — primary `221.2 83.2% 53.3%`, radius `0.5rem`,
  `.dark` 블록 없음.

## 타이포

- 폰트 스택 (한글 포함 — 현재 `Arial, Helvetica, sans-serif` 교체).
- 타입 스케일 / line-height / weight.

## 간격 · radius · elevation · 모션

- 스페이싱 스케일, 컨테이너 최대폭.
- `--radius` 및 lg/md/sm.
- 그림자 토큰 (얇고 낮게).
- duration/easing 토큰.

## 반응형 · 앱 대응

- `env(safe-area-inset-*)` 토큰, `viewport-fit=cover`.
- 터치 타깃 ≥ 44px, hover-only 제거.
- 브레이크포인트 360 / 768 / 1280.

## 프리미티브

| 컴포넌트 | variant | size | 상태 |
|---|---|---|---|
| button | (default·secondary 현재) → +outline·ghost·destructive·link | +sm·default·lg·icon | 확장 필요 |
| card / input / label / badge / separator / skeleton / … | | | 미생성 |
