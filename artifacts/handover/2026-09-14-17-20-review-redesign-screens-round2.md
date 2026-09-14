# code-review: redesign screens 2차 (`c7a831d..0ef20fd`)

- 2026-09-14 17:20, 리뷰어: claude (plan, `/code-review` 스킬)
- 대상: login·experiences·analyses-index·job-postings·analysis-history 리스타일
- **blocker: 0건**

## should-fix (4건 — main 병합 전 고치는 걸 권장)

1. **`add-job-posting/form.tsx`의 "URL로 채우기" 패널 배경색이 조용히 안 먹힘.**
   `<Card className={css({ bg: "surface" })}>`로 회색 배경을 주려 했는데, 컴파일된
   `styled-system/styles.css`에서 `.bg_bgElevated`(Card 기본 배경) 규칙이 `.bg_surface`보다
   나중에 정의돼 있어서 항상 이긴다 — `cn()`은 단순 문자열 결합이라 "나중에 넘긴 클래스가
   이긴다"는 보장이 없다. 패널이 다른 카드와 구분 안 되고 밋밋하게 보임. 타입체크로도 안 잡힘.
2. **`analyses/page.tsx`, `experiences/page.tsx`에서 페이지 자체 max-width(1152px/1024px)가
   삭제됐는데, 공용 레이아웃의 상한(1280px)이 그것보다 넓어서** 와이드 화면에서 카드 그리드가
   기존보다 128~256px 더 넓게 늘어남 — 디자인 스펙엔 "래퍼 삭제, app-shell이 담당"만 있고 상한이
   더 넓어진다는 언급은 없어서 의도된 변경인지 불확실.
3. **`experiences/page.tsx`에서 페이지 상단 이메일 표시를 삭제**했는데(스펙 근거: "사이드바에 이미
   있음"), 사이드바가 **접힌 상태에서는 이메일이 `display:none`**이라 그 근거가 항상 성립하지
   않음 — 사이드바를 접은 사용자는 화면 어디서도 계정을 확인할 수 없게 됨.
4. **에러 메시지 색상으로 `tagRed.text` 토큰을 페이지 배경 위에 직접 사용**(login/job-posting/
   experience 폼 전부). 이 토큰은 원래 `tagRed.bg` 배경과 짝지어 쓰도록 만든 배지용 색이라, 일반
   배경 위 대비가 검증 안 됨 — 특히 다크모드(`tagRedTextDark #F4A69B` on `bgElevated #191919`)에서
   대비가 의심됨.

## nit (6건 — 병합을 막지 않음, 나중에 정리해도 됨)

5. 체크박스(`minH: touchTarget` 44px)와 같은 행의 Input/select(`h:10` 40px) 높이가 안 맞아서
   그리드 행에서 ~4px 수직 정렬 어긋남 (`filter-form.tsx`).
6. `Input`/`Textarea` 공용 스타일에 `width` 지정이 빠짐 — 지금은 우연히 그리드/flex-1로 가려져
   있지만, 나중에 다른 컨테이너에 넣으면 폭이 안 맞을 수 있음. `<select>` 자리들은 이미 한 번
   `css({w:"full"})`로 개별 패치한 전례가 있어서 재발 가능성 있음.
7. `cn(inputStyle, css({w:"full"}))` 패턴이 5곳(파일 2개)에 복붙됨 — `selectStyle`로 뽑아서
   공용화하는 게 나음.
8. "폼 하단 상태 줄"(반응형 레이아웃 + 에러/성공 메시지 스타일) 이 login/experience/job-posting
   폼 3곳에 거의 동일하게 복붙됨.
9. `& > article + article` 구분선 스타일이 `experience-list.tsx`와 `history-list.tsx` 2곳에 중복.
10. Input/Textarea 포커스 시 색 전환에 `transitionProperty`/`transitionDuration`이 빠져서, 다른
    곳(카드 hover 등)과 다르게 포커스 시 테두리색이 즉시 바뀜(트랜지션 없음).

## 확인해서 제외한 항목

- `<main>`/래퍼 제거, `aside`→`Card` 랜드마크 변경, `lg`→`md` 브레이크포인트 변경은
  `artifacts/design/screens/experiences.md`/`analyses-index.md`에 의도된 변경으로 명시돼 있어
  제외함(스펙 문서 대조 확인함).

## 권장

should-fix 4건은 main 병합 전 수정 권장 — 특히 1번(배경 무효화)과 3번(접힌 사이드바 이메일 공백)은
사용자가 바로 체감 가능한 결함. nit 6건은 지금 안 고쳐도 병합을 막지 않으므로 스킵하거나 나중
정리 라운드로 미뤄도 됨.
