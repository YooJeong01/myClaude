# 캘린더 iOS풍 재작업 완료

- 완료 시각: 2026-09-14 15:04 KST
- 브랜치: `feat/design-system`
- 코드 커밋: `7ad12dc` `[feat] 캘린더 iOS풍 월간 보기 적용`

## 변경 파일

- `src/app/globals.css`
- `src/widgets/saved-calendar/ui/calendar-view.tsx`
- `src/widgets/saved-calendar/react-big-calendar.d.ts`

## T## 결과

- T1 그리드 테두리 최소화: 완료. 월간 뷰 세로 셀 구분선 제거, 오늘 셀 배경 제거, 다른 달 날짜는 숫자만 `textFaint` 톤으로 조정.
- T2 요일 헤더: 완료. 작고 옅은 uppercase 스타일 적용, 첫 번째 요일 헤더는 `tagRed.text`로 처리. RBC locale/주 시작일에 따라 첫 번째 컬럼 기준으로만 적용되는 한계 있음.
- T3 오늘 배지: 완료. `.rbc-now .rbc-button-link`를 30px 빨간 원형 배지로 변경.
- T4 일정 점(dot): 완료. `components={{ event: DotEvent }}` 연결, 이벤트 텍스트 대신 7px 점과 native `title` 툴팁 사용. 기존 분류 기준이 없어 이번 라운드는 전부 `tagBlue.text` 점으로 통일.
- T5 툴바: 유지. 우선순위 낮은 항목이라 기존 버튼 스타일을 보존.

## 검증

- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 통과 (`eslint . && steiger ./src`, `No problems found`)
- `pnpm build`: 미실행. 위임 문서 필수 게이트가 tsc/lint였고, 호스트 RAM 제약 및 heavy 프로세스 1개 규칙 때문에 이번 홉에서는 생략.
- 브라우저 육안 검증: 미실행. 위임 문서에 적힌 기존 제약(dev trace EPERM) 때문에 사용자가 실제 화면에서 재확인 필요.

## 스펙 이탈 / 한계

- 마감임박 이벤트를 빨간 점으로 나누는 분류는 기존 `toSavedCalendarEvents`에 기준이 없어 구현하지 않음. 모든 이벤트를 `tagBlue.text` 점으로 표시.
- 일요일 빨간 톤은 RBC 헤더의 첫 번째 컬럼 기준 CSS로 처리. locale/주 시작일이 바뀌면 일요일 특정 보장이 약함.

## 미해결 / 주의

- 실제 iOS풍 시각 결과는 브라우저에서 최종 확인 필요.
