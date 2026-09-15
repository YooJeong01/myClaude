# 버그: 사이드바 접은 뒤 다시 펼치는 토글이 안 보임/안 눌림

- 2026-09-14 08:05
- 발견 경위: 사용자가 앱 실행 — "접는 건 되는데 다시 펼칠 방법이 없다."
- 대상: `src/widgets/app-shell/ui/sidebar.tsx`, `panda.config.ts`

## 근본 원인 (계산해서 확인)

`sizes.sidebarCollapsed = 64px`, `<aside>`의 `p: 3`(12px 전방향) → 접혔을 때 안쪽 콘텐츠 영역은
`64 - 12*2 = 40px`.

- **상단 줄**: 브랜드 아이콘(`h:9/w:9` = 36px, `flexShrink:0`) + `gap:2`(8px) + 토글 `Button
  size="icon"`(지난 리뷰 수정으로 `minWidth:touchTarget`=44px 적용됨) = **88px 필요**, 40px밖에 없음.
- **하단 줄**: 아바타(`h:9/w:9`=36px) + `gap:2`(8px) + 로그아웃 `Button size="icon"`(마찬가지로 44px)
  = 역시 88px 필요, 40px밖에 없음.

`<aside>`가 `overflow: hidden`이라, 40px를 넘는 만큼은 화면에 안 그려지고 클릭도 안 된다 — 토글
버튼이 정확히 그 잘리는 위치에 있어서 접은 뒤엔 아예 접근 불가능해졌다.

두 개의 이전 수정(①터치 타깃 44px 강제 ②오늘 아침 고친 "실제로 64px로 줄어들게") 이 서로 따로는
맞는데 합쳐지니 안 맞았다.

## 고칠 방법

**T1.** `panda.config.ts`의 `theme.tokens.sizes.sidebarCollapsed`를 `64px` → `72px`로 변경.
(`72 - 24(패딩) = 48px` — 토글/로그아웃 버튼(44px) 하나만 들어갈 땐 여유 있음.)

**T2.** `sidebar.tsx` 상단 줄 — 접혔을 때(`isCollapsed`) **브랜드 아이콘을 숨기고 토글 버튼만 가운데
정렬로 남긴다**:
- 브랜드 아이콘 `<div>`에 `style={{ display: isCollapsed ? "none" : "inline-flex" }}` 추가(기존
  `css()`의 `display:"inline-flex"`는 정적값이라 그대로 두고, 이 자리만 조건부로 덮어써야 하니
  className 대신 style로 옮기거나, style이 className보다 우선 적용되는 걸 이용해 style만 추가해도 됨 —
  둘 다 가능, 일관성 있게 다른 곳처럼 style로 분리하는 쪽 추천).
- 상단 줄 컨테이너(`display:flex` 부분)에 `style={{ justifyContent: isCollapsed ? "center" :
  "flex-start" }}` 추가.
- 토글 `Button`의 `className={css({ ml: "auto" })}`(정적)는 접혔을 때 문제가 된다 — `ml:auto`가
  `justifyContent:center`를 무시하고 버튼을 오른쪽 끝으로 밀어버리기 때문. 이걸 제거하고
  `style={{ marginLeft: isCollapsed ? "0" : "auto" }}`로 동적 전환.

**T3.** `sidebar.tsx` 하단 줄(아바타+이메일+로그아웃) — 같은 원칙: 접혔을 때 **아바타를 숨기고
로그아웃 버튼만 가운데 정렬**:
- 아바타 `<div>`에 `style={{ display: isCollapsed ? "none" : "block" }}` 추가.
- 하단 줄 컨테이너에 `style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}` 추가.
- 로그아웃 wrapper `<div>`의 기존 `marginLeft: isCollapsed ? "0" : "auto"`(오늘 아침 수정분)는 이제
  `justifyContent:center`와 같이 쓰면 T2와 같은 충돌이 생긴다 — collapsed일 때 `marginLeft:"0"`이면
  auto-margin 문제는 없으니 그대로 둬도 되는지 확인하고, 혹시 여전히 안 가운데 정렬되면 같은 방식으로
  조정해라.

**T4.** 이 변경으로 `.agents/workflow.md` §6-11 규칙(Panda `css()`에 동적 값 금지)을 다시 어기지
않는지 확인 — 새로 추가하는 `justifyContent`/`display`/`marginLeft` 조건부 값은 전부 `style={{}}`로만
넣고 `css({})` 안에는 넣지 마라.

## 검증

- 브라우저로 직접 켜서 클릭 테스트하는 게 제일 확실하지만, 지난번처럼 로컬 Next dev가
  `.next/trace` EPERM으로 안 되면: 최소한 계산으로 확인해라 — 접힌 폭(72px) - 패딩(24px) = 48px
  안에 44px 버튼 하나만 들어가는 구성인지 (아이콘/아바타가 정말 `display:none`으로 빠지는지) 코드
  레벨에서 재확인.
- `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
- `styled-system/styles.css`에 이번에 건드린 속성들이 여전히 정적 클래스로만 남아있고 동적 값이
  새로 안 들어갔는지 `grep -rn "css({" src/widgets/app-shell` 재확인.

## 반드시 지킬 것

`.agents/workflow.md` §6 전체. 브랜치 이어서(`feat/design-system`), 새 브랜치 안 만듦, **병합 요청
안 함**, 범위 넓히지 마라(사이드바 상/하단 줄 + `sidebarCollapsed` 토큰 값 하나만).

## 완료 시 보고

`artifacts/handover/<ts>-codex-sidebar-toggle-fix-done.md`: 변경 파일, 계산 재확인 결과(72-24=48 ≥
44), tsc/lint 결과, 커밋 해시. **사용자가 실제로 다시 테스트해봐야 한다는 점 명시** — 이 세션에서
브라우저 클릭 검증이 계속 안 되고 있다.
