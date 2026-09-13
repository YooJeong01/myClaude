# 화면 스펙: login

- 대상: `app/login/page.tsx`, `src/features/auth/ui/login-form.tsx`.
- 선행: `app-shell.md`(사이드바는 없는 화면이지만 토큰·프리미티브는 공유), `experiences.md`(`Input`).
- **자동 로그인(구글 OAuth 등) 방식은 여전히 미확정** (`artifacts/design/screens/README.md`,
  `artifacts/status.md` "2026-09-13 제품 스코프 결정" 참조) — 이 스펙은 **그 결정을 기다리지 않고
  지금 실제로 있는 매직링크 폼만 리스타일한다.** OAuth 버튼을 넣을지는 별도 결정 사항이라 이번 범위
  아님. 나중에 추가하기로 결정되면 "아래 여지" 절 참고.

## 현재 → 변경

- **페이지 래퍼**(`login/page.tsx:22`, `<main className="min-h-screen bg-background px-6 py-12">`) —
  로그인은 사이드바가 없는 유일한 인증 화면(비보호 라우트)이라 `app/(app)/layout.tsx`를 안 거친다.
  **이 페이지는 자기 `min-h-screen` 래퍼를 유지**하되 토큰화: `bg: bg, minH: "100dvh", px: {base:4,
  md:6}, py: 12`.
- **중앙 정렬 섹션**(`:23`, `mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center`)
  → `maxW: "28rem"`(기존 `max-w-md`와 동일), `display:flex, flexDirection:column, justifyContent:
  center, minH: "calc(100dvh - 6rem)", mx: auto` 그대로 토큰화만.
- **카드**(`:24`, `rounded-md border bg-card p-6`) → **`Card`** (`p: 6`).
  - "로그인"(`text-sm font-medium text-muted-foreground`) → `textStyle: sm, fontWeight:500, color: textMuted`.
  - 제목 "매직링크로 시작"(`text-2xl font-semibold`) → `textStyle: "2xl"`.
  - 설명(`text-sm leading-6 text-muted-foreground`) → `textStyle: sm, color: textMuted`.
- **`LoginForm`** (`login-form.tsx`):
  - `inputClassName`(`:8-9`) → **`Input`** (이메일 필드, `type="email"` 그대로).
  - `<label>` → `textStyle: sm, fontWeight: 500`.
  - 메시지 영역(`:66-80`) — experiences.md와 동일(에러 `tagRed.text`, 기본 `textMuted`).
  - 제출 버튼 — 이미 `Button`, 유지.

## 아래 여지 (OAuth 결정되면, 지금은 안 만듦)

나중에 구글 OAuth를 추가하기로 하면: 카드 안 `Input`/버튼 아래에 구분선(`borderColor: border,
borderTopWidth: 1px` + 가운데 "또는" 텍스트) + `Button variant="outline"` 하나(구글 아이콘 + "구글
계정으로 계속하기") 추가하는 정도로 지금 구조를 거의 안 건드리고 확장 가능 — 목업(`Login.dc.html`)에
이미 그 레이아웃이 그려져 있음. 지금은 이 문단이 스펙이 아니라 메모.

## 반응형

- `max-w-md`(28rem) 안에서 이미 반응형 — 360px에서도 카드 폭이 뷰포트에 맞춰 줄어듦(부모가
  `px: {base:4}`). 별도 분기 없음.

## 다크모드

- 카드/인풋/버튼 전부 토큰 기반이라 자동. 카드가 화면 중앙에 단독으로 떠 있어서 다크에서 대비가
  가장 눈에 잘 띄는 화면 중 하나 — 육안 확인 시 우선 체크.

## 상태 / 터치 타깃

- `isPending` 동안 `Input`/`Button` `_disabled` 스타일 적용(다른 폼들과 동일).
- 이메일 `Input` + 제출 `Button` 전부 44px 이상.
