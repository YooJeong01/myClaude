# 버그: 사이드바 폴딩이 실제로 안 됨 (Panda 정적 분석 한계)

- 2026-09-14 07:12
- 발견 경위: 사용자가 앱을 직접 실행해서 확인 — "접었을 때 메뉴가 사라지지 않고 메뉴 정렬만 바뀐다."
- 대상: `src/widgets/app-shell/ui/sidebar.tsx`

## 근본 원인

should-fix 커밋(`c7a831d`)에서 도입한 `responsiveValue(collapsedValue, expandedValue)` 헬퍼가
`css({ display: responsiveValue(...), justifyContent: responsiveValue(...), w: responsiveValue(...),
px: responsiveValue(...), ml: responsiveValue(...) })` 형태로 **런타임 함수 호출 결과를 Panda `css()`에
직접 넘기고 있다.**

Panda CSS는 빌드 타임 정적 분석으로 실제 스타일시트를 미리 생성해두는 방식이라, 이렇게 런타임에만
값이 정해지는(`useState` 기반) 표현식은 **Panda가 어떤 CSS도 생성하지 못한다** — 공식 문서:
"you cannot directly use runtime values ... inside Panda's functions like css or cva"
(https://panda-css.com/docs/guides/dynamic-styling).

**직접 생성된 스타일시트(`styled-system/styles.css`)를 열어 확인함:**
- `.jc_center`는 존재(다른 파일이 우연히 같은 리터럴 값을 써서 생성됨) → 접었을 때 정렬만 "우연히" 됨.
- `.jc_flex-start`, `.d_none`, `.d_inline`, `.w_sidebarCollapsed`, `.w_sidebarExpanded`, `.px_0`은
  **전부 존재하지 않음** → 라벨 표시/숨김도, 사이드바 폭 자체도 실제로는 전혀 안 바뀌고 있었다.

## 고칠 방법 (Panda 공식 권장 우회법 — inline style)

`responsiveValue`를 쓰던 7개 지점을 `css()` 밖으로 빼서 **인라인 `style={{}}`**로 옮긴다. 토큰 값은
Panda가 생성해주는 CSS 변수를 그대로 참조해서 하드코딩을 피한다(확인된 변수명):
- 폭: `var(--sizes-sidebar-collapsed)` / `var(--sizes-sidebar-expanded)`
- 패딩: `var(--spacing-3)` / `0`

7개 지점 (전부 `sidebar.tsx` 안):
1. `<aside>`의 `w: responsiveValue("sidebarCollapsed", "sidebarExpanded")` → `style={{ width:
   isCollapsed ? "var(--sizes-sidebar-collapsed)" : "var(--sizes-sidebar-expanded)" }}`
2. 브랜드명 `<span>`의 `display: responsiveValue("none", "inline")`
3. nav `<Link>`의 `justifyContent: responsiveValue("center", "flex-start")`
4. nav `<Link>`의 `px: responsiveValue(0, 3)` → `paddingInline: isCollapsed ? "0" : "var(--spacing-3)"`
5. nav 라벨 `<span>`의 `display: responsiveValue("none", "inline")`
6. 이메일 `<span>`의 `display: responsiveValue("none", "block")`
7. 로그아웃 wrapper `<div>`의 `ml: responsiveValue(0, "auto")` → `marginLeft: isCollapsed ? "0" : "auto"`

각 요소에서 `css({...})`는 **동적이지 않은 나머지 속성만** 남기고, 위 항목만 별도 `style={{...}}`
prop으로 옮겨서 두 개를 같이 쓴다(className={css({...})} style={{...}}). `responsiveValue` 헬퍼
함수 자체와 `isCollapsed`/`manualCollapsed`/`viewportCollapsed`/`mql` 로직(리뷰 지난번 수정에서
정확히 짠 부분)은 그대로 둔다 — 그 상태 관리 로직 자체는 문제없다, 그 값을 `css()`에 넘기는 부분만
문제다.

## 검증

- `pnpm dev` 띄우고 실제로 브라우저에서 토글 버튼 눌러서 사이드바 폭이 진짜 바뀌는지, 라벨이 진짜
  사라지는지 육안 확인 — 이번엔 `styled-system/styles.css`에서 `.w_sidebar` 어쩌구, `.d_none`,
  `.d_inline` 클래스가 실제로 생성됐는지도 grep으로 확인해라(생성 안 됐으면 아직 `css()` 안에 동적
  값이 남아있다는 뜻).
- `pnpm exec tsc --noEmit` + `pnpm lint` 그린.

## 반드시 지킬 것

`.agents/workflow.md` §6. 추가로:
1. 같은 브랜치(`feat/design-system`)에 이어서 커밋, 새 브랜치 만들지 마라.
2. **여전히 병합 요청하지 마라.**
3. 범위 넓히지 마라(이 파일 하나, 이 패턴만).
4. 다른 화면에도 `responsiveValue` 같은 패턴이나 `css()`에 함수 호출/변수를 직접 넘기는 코드가 있는지
   `grep -rn "css({" src app`로 훑어보고, 있으면 같은 방식(정적 값만 `css()`에, 동적인 건 `style`로)으로
   같이 고쳐라 — 범위 넓히는 게 아니라 같은 버그 클래스를 잡는 거라 허용.

## 완료 시 보고

`artifacts/handover/<ts>-codex-sidebar-dynamic-css-fix-done.md`: 변경 파일, 다른 곳에서 발견한 같은
패턴 목록(있다면), `styled-system/styles.css`에서 관련 클래스 생성 확인 결과, tsc/lint 결과, 커밋 해시.
