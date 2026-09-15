# 화면 스펙: motivation (지원동기 — 경험 선택 + 결과)

- 대상: `app/(app)/dashboard/analyses/[id]/motivation/page.tsx`(경험 선택),
  `src/features/run-motivation/ui/experience-picker.tsx`,
  `app/(app)/dashboard/drafts/[id]/page.tsx`(결과 — 없으면 `MotivationResultView`를 감싼 동일 패턴으로
  간주), `src/widgets/motivation-result/ui/result.tsx`(`MotivationResultView`).
  `mirrored-result.tsx`는 `result.tsx`와 동일 패턴 적용.
- 선행: `app-shell.md`.
- 목업 참조: `Motivation.dc.html` (좌: 경험 선택 카드, 우: 결과 — 실제 코드는 좌우 대신 **위(선택) →
  아래(이력)** 순서 2섹션 구조라 목업 레이아웃 그대로 옮기지 말고 아래 실제 구조를 따른다. 목업에서
  가져올 것: 선택된 경험 항목을 `tagBlue` 톤으로 강조하는 스타일만).

## A. 경험 선택 페이지 (`analyses/[id]/motivation/page.tsx`)

- **바깥 래퍼**(`page.tsx:34-35`) — 삭제(app-shell).
- **헤더**(`page.tsx:36-46`): 기업·역할(`text-sm font-medium text-muted-foreground`) → `textStyle: sm,
  fontWeight: 500, color: textMuted`. 제목 → `textStyle: "3xl"`. 설명 문구 → `textStyle: sm, color:
  textMuted, maxW: "2xl"`.
- **2열 섹션**(`page.tsx:48-65`, `grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]`):
  - 좌측 "경험 선택" 제목(`text-lg font-semibold`) → `textStyle: lg`.
  - 우측 "분석 요약" aside(`rounded-md border bg-card p-5`) → **`Card`** (`p: 5`). 제목 `textStyle: lg`,
    본문 `textStyle: sm, color: textMuted`. "분석 열기" 버튼 이미 `Button variant="secondary"` — 유지.
- **`ExperiencePicker`** (`experience-picker.tsx`):
  - 빈 상태(`:28-30`, `rounded-md border bg-card p-5`) → `Card` + `textStyle: sm, color: textMuted`.
  - 항목 `<label>`(`:38`, `rounded-md border bg-card p-4 ... hover:bg-accent`) → `Card` 스타일 기반이되,
    **선택 여부에 따라 톤 분기**: 선택됨(`selectedIds.includes(id)`) → `bg: tagBlue.bg, borderColor:
    tagBlue.bg`(또는 `link`), 텍스트 `color: tagBlue.text`(목업의 선택 카드 톤과 동일 컨셉). 미선택 →
    기본 `Card`(`bg: bgElevated, borderColor: border`) + `_hover: { bg: surface }`.
  - 체크박스(`:41-47`, `size-4`) — 네이티브 `<input type="checkbox">` 유지(포커스 가능해야 하니 커스텀
    아이콘 박스로 완전히 대체하지 말 것), 크기만 살짝 키워도 됨(`size-4`→`size-4` 유지 또는 5, 터치
    영역은 `<label>` 전체가 44px 이상이면 문제없음).
  - 제목(`text-sm font-medium`) → `textStyle: sm, fontWeight: 500`. 본문(`line-clamp-3 text-sm leading-6
    text-muted-foreground`) → `textStyle: sm, color: textMuted`(line-clamp 유지).
- **지원동기 이력 섹션**(`page.tsx:67-103`):
  - 목록 컨테이너(`divide-y rounded-md border bg-card`) → `Card` + 항목 간 `borderTopWidth:1px,
    borderColor:border`(첫 항목 제외), dashboard.md 목록 패턴과 동일.
  - 빈 상태 → `Card` + `textStyle: sm, color: textMuted`.
  - 각 항목: "경험 N개 조합"(`text-sm font-medium`) → `textStyle: sm, fontWeight:500`. 날짜(`text-sm
    text-muted-foreground`) → `textStyle: sm, color: textMuted`. "결과 열기" 링크(`text-primary
    underline-offset-4 hover:underline`) → `color: link`, hover에서만 underline.

## B. 결과 페이지 (`drafts/[id]/page.tsx` → `MotivationResultView`)

- 페이지 래퍼: 다른 화면들과 동일 패턴이면(확인 못 한 상태 — implement가 실제 파일 보고 판단)
  `min-h-screen`/`max-w-5xl` 삭제, app-shell 컨테이너에 위임.
- **헤더**(`result.tsx:17-28`): 날짜 → `textStyle: sm, color: textMuted`. 제목 "지원동기 소재 초안" →
  `textStyle: "3xl"`. 설명 → `textStyle: sm, color: textMuted`.
- **`angles` 카드들**(`result.tsx:30-48`, `rounded-md border bg-card p-5`) → **`Card`** (`p: 5`).
  - `point`(`text-sm font-medium text-primary`) → `textStyle: sm, fontWeight:500, color: link`
    (analysis-detail.md과 동일 이유 — 강조는 `link` 토큰).
  - `matched_experience`(`text-lg font-semibold`) → `textStyle: lg`.
  - `connection`(`text-sm leading-6 text-muted-foreground`) → `textStyle: sm, color: textMuted`.
  - `draft_sentences` 리스트(`list-disc ...`) → analysis-detail.md의 `BulletList`와 동일 처리.
  - 빈 상태(`:49-53`) → `Card` + `textStyle: sm, color: textMuted`.
- **"예시 흐름" 섹션**(`result.tsx:56-61`, `rounded-md border bg-card p-5`) → `Card`, 제목 `textStyle:
  lg`, 본문 `textStyle: sm, color: textMuted`.

## 반응형

- 2열 섹션(`lg:grid-cols-[...]`) → 768px 미만 1열(경험 선택이 먼저, 분석 요약 카드는 아래로).
- `angles` 카드 목록은 이미 1열 스택.

## 다크모드

- 선택된 경험 카드(`tagBlue` 톤), `point`(`link` 색) 다크 대비 확인.

## 상태 / 터치 타깃

- `RunMotivationButton`의 `disabled`/`disabledReason`(오프라인) 상태 — 버튼 프리미티브의 `_disabled`
  스타일(이미 `panda.config.ts` button recipe에 `opacity:0.5, cursor:not-allowed` 있음) 그대로 적용되는지
  확인만. 이유 문구(`disabledReason`) 노출 방식은 기존 로직 유지, 색만 `color: textMuted, textStyle: xs`
  로 통일.
- 체크박스 `<label>` 전체 44px 이상(패딩으로 이미 충족될 것, implement가 실측 확인).
