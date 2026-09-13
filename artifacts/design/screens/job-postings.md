# 화면 스펙: job-postings (공고 입력·검색·저장 — 기능 위젯 3종)

- 대상: `src/features/add-job-posting/ui/form.tsx`, `src/features/search-job-postings/ui/filter-form.tsx`,
  `src/features/toggle-saved-posting/ui/save-toggle.tsx`. 덤으로 `src/features/run-analysis/ui/run-analysis-button.tsx`
  (버튼 자체는 이미 프리미티브라 손 댈 것 거의 없음, 아래 메모만).
- 선행: `app-shell.md`, `experiences.md`(`Input` 프리미티브).
- 이 3개는 독립 화면이 아니라 **대시보드(`dashboard.md`)·기업분석 목록(`analyses-index.md`)에 이미
  끼워져 있는 위젯**이다. 그 화면들은 1차 라운드에서 컨테이너만 리스타일했고, 이 안의 폼/필터는
  범위 밖이라 아직 옛날 `inputClassName`/Tailwind 그대로다 — 이번 태스크가 그걸 마저 한다.

## `AddJobPostingForm` (`add-job-posting/ui/form.tsx`)

- **URL 채우기 박스**(`:137-165`, `rounded-md border bg-muted/30 p-4`) → **`Card`** (`p: 4`, 배경은
  `surface` 톤 — `bg-muted/30`이 은은한 강조였던 의도라 `Card`의 기본 `bgElevated`보다 `surface`가 더
  맞음. `Card`에 `className={css({ bg: "surface" })}`로 오버라이드).
  - `<input>`(`inputClassName`) → **`Input`**.
  - "URL로 채우기" 버튼 — 이미 `Button variant="secondary"`, 유지.
- **필드 그리드**(`:167-211`, 회사명/직무/고용형태/마감일): 전부 `<input>`/`<select>` →
  **`Input`**(텍스트·URL·날짜 type), `<select>`는 `experiences.md`에서 정한 대로 `inputStyle` 공유.
  `<label>`의 `text-sm font-medium` → `textStyle: sm, fontWeight: 500`.
- **공고 URL / 공고 본문**(`:213-232`) → `Input`/`Textarea`(본문은 `minHeight: "144px"`, 기존
  `min-h-36`=9rem 유지).
- **메시지 영역**(`:234-244`) — experiences.md와 동일 처리(에러 `tagRed.text`, 기본 `textMuted`).
- 저장 버튼 — 이미 `Button`, 유지.

## `JobPostingFilterForm` (`search-job-postings/ui/filter-form.tsx`)

- **폼 컨테이너**(`:48-51`, `grid gap-3 rounded-md border bg-card p-4`) → **`Card`** (`p: 4`), grid
  템플릿은 그대로(`md:grid-cols-[...]` → Panda `md` breakpoint로 이식).
- `fieldClassName`(`:28-29`, 검색창/고용형태 select/출처 select) → **`Input`**(검색창), `<select>` 2개는
  `inputStyle` 공유.
- "마감 전" 체크박스 라벨(`:81-89`) — 네이티브 체크박스 유지(motivation.md의 경험 선택 체크박스와 동일
  원칙), 텍스트만 `textStyle: sm, fontWeight: 500`.
- 검색 버튼 — 이미 `Button`, 유지.

## `SaveToggle` (`toggle-saved-posting/ui/save-toggle.tsx`)

- 버튼 자체는 이미 `Button variant="secondary"` — 손댈 것 없음.
- 에러 메시지(`:57-61`, `text-destructive`) → `color: tagRed.text, textStyle: sm`.

## `RunAnalysisButton` (`run-analysis/ui/run-analysis-button.tsx`) — 참고용, 손댈 것 적음

- 버튼 이미 `Button` 프리미티브 — 유지.
- 상태 메시지(`:78-84`, `text-sm text-muted-foreground`) → `textStyle: sm, color: textMuted`.

## 반응형

- `AddJobPostingForm` 필드 그리드(`sm:grid-cols-2`) → 768px 미만 1열(Panda `md` breakpoint로 이식,
  이 프로젝트 반응형 기준이 360/768/1280이라 기존 `sm`(640px 언저리) 브레이크포인트들은 전부 `md`로
  통일해서 옮긴다 — 다른 화면 스펙들과 같은 원칙).
- `JobPostingFilterForm`의 `md:grid-cols-[...]`는 그대로 유지(이미 768px 기준).

## 다크모드

- `Input`/`Textarea`/`select` 전부 experiences.md에서 정한 토큰 그대로라 자동 대응.

## 상태 / 터치 타깃

- 모든 필드·버튼 `Input`/`Button` 프리미티브 기본값이 44px 이상 보장.
- "마감 전" 체크박스는 `<label>` 전체 높이가 `h-10`(40px)로 고정돼 있던 것(`filter-form.tsx:81`) →
  `minH: "touchTarget"`로 44px 이상으로 조정.
