# 화면 리스타일 1차 라운드 완료 (Codex 작업 + plan 마무리)

- 2026-09-13 21:40
- 브랜치: `feat/design-system`

## 상황 — Codex가 usage limit으로 중단됨

Codex가 T1~T5 전부 커밋까지는 마쳤는데, 완료 보고서를 쓰기 전에 ChatGPT/Codex 쪽 **usage limit에
걸려서 중단**됐다(`ERROR: You've hit your usage limit... try again at 11:38 PM` — OOM이 아니라 처음
보는 실패 유형). 5개 커밋 자체는 전부 깨끗하게 들어가 있어서(중간에 끊긴 파일 없음), plan이 이어받아
검증 + 이 완료 문서 작성까지 마무리했다.

## 커밋 (T1~T5, 전부 완료)

- `9e21192` `[feat] 앱 셸 사이드바 추가` — `app/(app)/layout.tsx` 신설, `src/widgets/app-shell/`
  (폴더블 사이드바, `index.ts` 공개 API 포함)
- `f3031cf` `[feat] 대시보드 리스타일` — `src/views/dashboard/index.tsx`
- `c35d8d6` `[feat] 기업분석 상세 리스타일` — `company-analysis-report/ui/{report,sources,mirrored-report}.tsx`
- `0cf95bb` `[feat] 지원동기 화면 리스타일` — `analyses/[id]/motivation/page.tsx`, `experience-picker.tsx`,
  `drafts/[id]/page.tsx`, `motivation-result/ui/{result,mirrored-result}.tsx`
- `5d8a718` `[feat] 캘린더 화면 리스타일` — `calendar/page.tsx`, `saved-calendar/ui/calendar-view.tsx`,
  `src/app/globals.css`(react-big-calendar `.rbc-*` 오버라이드)

총 16개 파일, +732/-193줄.

## plan이 이어받아 확인한 것

- `pnpm exec tsc --noEmit`: **통과**
- `pnpm lint`(eslint + steiger, FSD 위반 0): **통과**
- `pnpm dev`: **정상 부팅** ("Ready in 4.5s", `panda codegen`/`cssgen` 정상 — 89개 파일에서 CSS 추출)
- `curl /`: 200, `curl /dashboard`(미인증): 307 리다이렉트 — 서버 에러 없음.
- `globals.css`의 react-big-calendar 오버라이드를 직접 열어봤다 — **Panda가 생성한 CSS 변수
  (`var(--colors-text)` 등)를 참조하는 방식**을 썼다. 스펙에서 "가능하면 CSS 변수 참조 우선"이라고 한
  것보다 나은 선택 — `.dark .rbc-...` 블록을 따로 안 만들어도 다크모드가 자동으로 따라간다. 툴바 버튼
  `min-height: 44px`도 스펙대로 들어가 있음.

## 아직 안 한 것

- **코드리뷰 미실시** — 5개 파일 전체를 diff 레벨로 정밀 검토하지 않았다(위 항목은 스모크 확인 수준).
  다음 단계로 `/code-review` 돌리는 걸 권장.
- **육안 확인 미실시** — 로그인 세션이 있어야 대시보드 등 실제 내용을 볼 수 있어서, curl 스모크만
  했고 실제 렌더 결과(라이트/다크, 반응형)는 안 봤다.
- 나머지 화면(experiences/analyses-index/login/job-postings/analysis-history)은 여전히 무스타일 —
  2차 라운드 대상.

## 병합 보류

여전히 유지 — 2차 라운드까지 끝나야 사용자 병합 대상.
