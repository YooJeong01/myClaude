# screens 2차 code-review nit 6건 정리 위임 (Codex)

- 2026-09-15 22:40
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 브랜치: `feat/screens-nit-cleanup` (`main`에서 새로 땀, `main`은 이미 리디자인+job-listing-filters
  병합·push 완료된 상태).
- 배경: `artifacts/handover/2026-09-14-17-20-review-redesign-screens-round2.md`의 nit 6건.
  should-fix 4건은 이미 반영되어 병합됐고, nit 6건만 병합을 막지 않아 미뤄뒀던 것 — 사용자 결정이
  필요 없는 순수 코드 품질 정리라 이번에 마저 처리.

## 1. 체크박스-인풋 행 높이 불일치 (`filter-form.tsx`)

체크박스(`minH: "touchTarget"` = 44px)와 같은 그리드 행에 있는 Input/select(`h: 10` = 40px)의
높이가 달라서 ~4px 수직 정렬이 어긋난다. 체크박스 행의 높이를 40px 계열로 맞추거나, 그리드 행
자체에 `alignItems: "center"`를 확실히 줘서 시각적으로 어긋나 보이지 않게 해라 — 터치 타겟
44px 자체(접근성 최소 크기)는 유지하되, 인풋과의 높이 차이가 안 보이게 하는 쪽으로.

## 2. `Input`/`Textarea` 공용 스타일에 `width` 누락 (`src/shared/ui/input.tsx`,
   `src/shared/ui/textarea.tsx`)

지금은 그리드/`flex-1` 컨테이너에 우연히 가려져 있지만 공용 컴포넌트 기본 스타일에 `w: "full"`이
빠져있다. 두 컴포넌트의 기본 recipe/style에 `width: "100%"`(Panda `w: "full"`)를 추가해라.

## 3. `cn(inputStyle, css({w:"full"}))` 중복 패턴 → `selectStyle` 공용화

5곳(파일 2개, `filter-form.tsx` 등)에 `cn(inputStyle, css({w:"full"}))` 같은 패턴이 복붙돼있다.
2번 항목에서 `Input`/`Textarea` 자체에 `w:"full"`을 넣으면 이 패턴의 존재 이유 자체가 없어지는
케이스가 많을 것 — 우선 2번을 적용한 뒤, `<select>` 자리들에 남는 반복 패턴이 있으면
`src/shared/ui/`에 `selectStyle`(또는 기존 `input.tsx`의 recipe를 재사용하는 select 전용 헬퍼)로
뽑아서 정리해라.

## 4. 폼 하단 상태 줄(반응형 레이아웃 + 에러/성공 메시지) 중복 (login/experience/job-posting 폼 3곳)

`src/features/auth/ui/login-form.tsx`, `manage-experience/ui/experience-form.tsx`,
`add-job-posting/ui/form.tsx` 3곳에 폼 하단 상태 줄 스타일(반응형 배치 + 에러/성공 메시지)이
거의 동일하게 복붙돼있다. 공용 컴포넌트나 훅으로 뽑아서 3곳에서 재사용하도록 정리해라
(예: `src/shared/ui/form-status-row.tsx` 같은 작은 컴포넌트).

## 5. `& > article + article` 구분선 스타일 중복 (`experience-list.tsx`, `history-list.tsx`)

두 파일에 동일한 `& > article + article` 구분선 CSS가 중복돼있다. 공용 스타일(예:
`src/shared/ui/`의 헬퍼 함수나 공용 `listStyle`)로 뽑아서 두 곳에서 재사용해라.

## 6. Input/Textarea 포커스 전환에 트랜지션 없음

포커스 시 테두리색이 카드 hover 등 다른 곳과 다르게 즉시 바뀐다(트랜지션 없음). `input.tsx`/
`textarea.tsx`의 포커스 스타일에 `transitionProperty: "colors"` (또는 `"border-color"`),
`transitionDuration`을 다른 컴포넌트(카드 hover 등)와 일관된 값으로 추가해라.

## 검증

- `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm build` 통과.
- 순수 스타일/구조 정리라 기능적 회귀 리스크는 낮지만, 가능하면 대시보드(필터폼)·로그인·경험
  관리 화면 정도는 브라우저로 훑어서 확인해라. 안 되면 done 문서에 "코드 근거로는 확실하나
  브라우저 미확인" 명시.

## 완료 시 보고

`artifacts/handover/<ts>-codex-screens-nit-cleanup-done.md`: 변경 파일, 커밋 해시, tsc/lint/build
결과, 6건 각각 적용 여부(스킵한 게 있으면 이유). **`main` 병합·push는 하지 마라** — `feat/screens-nit-cleanup`
브랜치에만 커밋.
