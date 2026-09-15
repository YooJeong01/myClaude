# E2E 스펙 갱신 + 768px 필터폼 그리드 수정 완료

- 완료 시각: 2026-09-14 21:47
- 브랜치: `feat/design-system`
- main 병합/push: 하지 않음

## T1. 768px 필터폼 체크박스 라벨 줄바꿈 수정

- 수정 파일:
  - `src/features/search-job-postings/ui/filter-form.tsx`
- 내용:
  - 필터 폼 그리드를 `base: 1fr`, `md: repeat(2, minmax(0, 1fr))`, `xl: dense 7열`로 조정.
  - 체크박스 라벨에 `whiteSpace: "nowrap"` 적용.
- 커밋:
  - `eaf6dc5` `[fix] 768px 필터폼 그리드 줄바꿈 수정`

## T2. 공고 검색·페이지네이션 E2E 스펙 갱신

- 수정 파일:
  - `e2e/day5-report.spec.ts`
  - `artifacts/test-reports/day5-e2e.md`
- 내용:
  - 옛 `더 보기`/`cursor` 검증 제거.
  - 숫자 페이지네이션 2페이지 링크 클릭과 `page=2` URL 확인 추가.
  - 1페이지의 `이전` 버튼 비활성 확인 추가.
  - 전체 E2E 재실행 중 8번 북마크 시나리오가 낙관적 UI만 보고 reload하는 타이밍 문제로 1회 실패해, 서버 액션 완료를 `toBeEnabled()`로 기다리도록 안정화.
- 커밋:
  - `b00a800` `[fix] 공고 페이지네이션 E2E 스펙 갱신`

## 검증 결과

- `cmd /c pnpm exec tsc --noEmit`: 통과
- `cmd /c pnpm lint`: 통과 (`eslint . && steiger ./src`, FSD 문제 없음)
- `cmd /c pnpm build`: 통과
- `cmd /c pnpm test:e2e`: 통과, 9/9
  - 갱신한 7번 actual: `검색 적용(이전: 전체 1612건 중 10건), 2페이지 이동=true, 1페이지 이전버튼 비활성=true`

## 브라우저/반응형 확인

- Playwright E2E는 실제 Chromium + 프로덕션 서버로 통과.
- 360/768/1280 개별 viewport 측정은 Supabase service-role 로그인 링크 생성이 필요한 별도 스크립트가 권한 리뷰에서 차단되어 미실행.
- 코드상 768px 구간은 더 이상 7열 dense grid가 아니며, `md` 2열 + label nowrap이라 기존 글자 단위 줄바꿈 원인은 제거됨.

## 새 패키지/env/마이그레이션

- 새 패키지 없음
- 새 env 없음
- 마이그레이션 없음

## 스펙 이탈/가정

- Panda breakpoint가 `xs/md/xl`만 있어 위임 예시의 `lg(1024px)` 대신 기존 설정의 `xl(1280px)`에서 dense 7열을 활성화.
- 전체 E2E 그린을 위해 T2 범위 안에서 8번 북마크 시나리오의 서버 액션 완료 대기만 함께 안정화.

## 미해결/주의

- `.claude/settings.local.json` 미추적 파일은 작업 전부터 있었고 건드리지 않음.
- main 병합 전 화면 QA가 768px 실제 viewport를 다시 육안 확인하면 더 확실함.
