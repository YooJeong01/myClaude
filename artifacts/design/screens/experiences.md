# 화면 스펙: experiences (경험 관리)

- 대상: `app/(app)/dashboard/experiences/page.tsx`, `src/features/manage-experience/ui/{experience-form,experience-list}.tsx`.
- 선행: `app-shell.md`, 그리고 **신규 `Input`/`Textarea` 프리미티브**(`design-system.md` 프리미티브
  표 참조 — 이 화면 스펙이 그 프리미티브를 처음 쓰는 자리).

## 신규 프리미티브 — `Input`/`Textarea` (이 태스크에서 같이 만든다)

`src/shared/ui/input.tsx`, `src/shared/ui/textarea.tsx` — `card.tsx`와 같은 패턴(단일 스타일,
`React.forwardRef`, `cn`으로 className 병합). 스타일:
- `Input`: `bg: bg, borderColor: border, borderRadius: input, borderWidth: 1px, color: text,
  h: 10, px: 3, textStyle: sm`. `_placeholder: { color: textFaint }`.
  `_focus: { borderColor: link, outline: "2px solid", outlineColor: link, outlineOffset: "1px" }`.
  `_disabled: { cursor: "not-allowed", opacity: 0.6 }`.
- `Textarea`: 위와 동일 + `minHeight`는 호출부에서 `className`으로 오버라이드 가능하게(기존
  `min-h-40`/`min-h-36` 재현), `py: 2, resize: "vertical"`.
- `<select>`는 별도 컴포넌트 없이 `Input`이 export하는 스타일(`inputStyle`)을 `className={cn(inputStyle,
  className)}`으로 재사용 — `<select className={inputStyle}>`처럼 직접 스타일 객체를 가져다 쓴다.

## 현재 → 변경

- **페이지 래퍼** (`experiences/page.tsx:24-25`) — 삭제(app-shell).
- **헤더**(`:26-33`): 이메일 표시는 app-shell 사이드바로 이미 옮겨졌으니 **삭제**(dashboard.md와 동일
  이유). 제목만 `textStyle: "3xl"`로.
- **2열 섹션**(`:35-59`, `경험 추가` 폼 + `저장된 경험` 통계 aside):
  - 두 패널(`rounded-md border bg-card p-5`) → **`Card`** (`p: 5`).
  - aside는 랜드마크 유지 필요 없음(순수 통계 요약이지 별도 섹션 성격 아님) — `Card` 기본(`div`)으로 충분,
    `as="aside"` 안 써도 됨(calendar/motivation과 다른 점 — 거기는 독립된 보조 정보 패널이라
    `aside`가 의미 있었고, 여긴 폼과 나란히 있는 요약 카드라 굳이 랜드마크 필요 없음).
  - 통계 숫자(`text-3xl font-semibold`) → `textStyle: "3xl"`.
- **`ExperienceForm`** (`experience-form.tsx`):
  - `inputClassName`(`:14-15`) → **`Input`** 프리미티브로 교체(제목 필드).
  - `textareaClassName`(`:17-18`) → **`Textarea`** 프리미티브로 교체(내용 필드), `minHeight: "160px"`
    (기존 `min-h-40`=10rem 유지).
  - `<label>`의 `text-sm font-medium` → `textStyle: sm, fontWeight: 500`.
  - 메시지 영역(`:96-108`, 에러는 `text-destructive`) → 에러는 `color: tagRed.text`, 성공/기본은
    `color: textMuted`, 전부 `textStyle: sm`.
  - 저장 버튼 — 이미 `Button` 사용, 유지.
- **`ExperienceList`** (`experience-list.tsx`):
  - 빈 상태(`:48-53`) → `Card` + `textStyle: sm, color: textMuted`.
  - 에러 메시지(`:58-60`, `text-destructive`) → `color: tagRed.text, textStyle: sm`.
  - 목록 컨테이너(`:61`, `divide-y rounded-md border bg-card`) → `Card` + 항목 구분선(dashboard.md
    목록 패턴과 동일: 첫 항목 제외 `borderTopWidth:1px, borderColor:border`).
  - 항목 제목(`text-base font-semibold`) → `textStyle: lg`. 본문(`whitespace-pre-wrap text-sm
    leading-6 text-muted-foreground`) → `textStyle: sm, color: textMuted, whiteSpace: "pre-wrap"`.
  - "닫기"/"수정"/"삭제" 버튼 — 이미 `Button variant="secondary"`, 유지.

## 반응형

- 2열 섹션(`lg:grid-cols-[...]`) → 768px 미만 1열.

## 다크모드

- `Input`/`Textarea` 포커스 링(`link` 토큰) 다크 대비 확인.

## 상태 / 터치 타깃

- 폼 필드 `disabled` 상태(`isPending`) — `Input`/`Textarea`의 `_disabled` 스타일로 통일.
- 체크박스류 없음(전부 텍스트 필드).
