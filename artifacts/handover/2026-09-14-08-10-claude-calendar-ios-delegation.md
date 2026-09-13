# 캘린더 iOS 기본 캘린더풍 재작업 위임 (Codex)

- 2026-09-14 08:10
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/design/screens/calendar.md`의 "iOS 기본 캘린더풍 v2" 절이 정본.** UTF-8로 읽어라.
  `.agents/implement.md`, `.agents/workflow.md`, `AGENTS.md`도 같은 방식으로 읽어라.
- **순서 주의**: 이 위임은 사이드바 토글 버그 수정(`2026-09-14-08-05-...`) **다음에** 실행해라 —
  같은 브랜치·같은 트리라 heavy 프로세스 겹치면 안 됨. 이미 사이드바 커밋이 있으면 이어서 진행.

## 상황

사용자가 캘린더 화면을 실제로 보고 "아이폰 기본 캘린더처럼(디자인+색 전부)"를 요청했다. 완전 복제가
아니라 iOS 캘린더의 특징적 요소(그리드선 최소화, 오늘=빨간 원 배지, 일정=점(dot), 옅은 요일 헤더)를
가져오는 거다. `react-big-calendar` 라이브러리 DOM 구조 제약 안에서 최대한 가깝게 — 완전히 안 되는
부분은 완료 문서에 한계로 남기면 된다(억지로 라이브러리를 바꾸거나 커스텀 그리드를 새로 짜지 마라).

## 작업 범위

`calendar.md`의 "iOS 기본 캘린더풍 v2" 절 그대로:

**T1. 그리드 테두리 최소화** — `src/app/globals.css`의 `.rbc-*` 오버라이드 수정. 세로 셀 구분선 제거
검토, 다른 달 날짜는 배경 대신 숫자 색만 `textFaint`로.

**T2. 요일 헤더** — 작고 옅게(`xs`, `textFaint`, uppercase). 일요일 빨간 톤은 시도해보되 라이브러리
제약으로 안 되면 생략하고 done 문서에 명시(우선순위 낮음).

**T3. 오늘 배지 (핵심)** — `.rbc-now .rbc-button-link`를 28~32px 원형 배지로. 배경
`var(--colors-tag-red-text)`, 글자 흰색, `fontWeight:700`.

**T4. 일정을 점(dot)으로 (핵심)** — `calendar-view.tsx`의 `<Calendar>`에 `components={{ event:
DotEvent }}` 추가. `DotEvent`는 같은 위젯 폴더 안에 작게(별도 slice 안 만듦). 점 6~8px 원형,
마감임박=`tagRed.text`/나머지=`tagBlue.text`(분류 로직 없으면 전부 `tagBlue.text`, done 문서에 명시).
RBC 기본 이벤트 행 높이가 과하면 CSS로 줄여라.

**T5. 툴바** — 우선순위 낮음. 시간/여유 되면 prev/next 버튼만 테두리 없는 chevron 느낌으로, 안 되면
현재 스타일 유지해도 스펙 이탈 아님.

## 반드시 지킬 것

`.agents/workflow.md` §6 전체 (§6-11 — Panda `css()`에 동적 값 넣지 말 것, 특히 이번엔 순수 CSS
(`globals.css`)라 해당 없지만 `calendar-view.tsx`에서 `DotEvent`를 Panda `css()`로 스타일링할 거면
정적 값만 써라). 추가로:
1. 같은 브랜치(`feat/design-system`)에 이어서 커밋, 새 브랜치 안 만듦.
2. 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
3. **여전히 병합 요청하지 마라.**
4. 새 패키지 없음 — `react-big-calendar`가 이미 지원하는 `components` prop만 쓴다.
5. T2/T5처럼 "우선순위 낮음"이라 표시된 항목은 안 되면 스킵하고 명시만 해도 된다 — 억지로 하지 마라.
   T3/T4(오늘 배지, 점 이벤트)는 핵심이라 꼭 되게 해라.

## 완료 시 보고

`artifacts/handover/<ts>-codex-calendar-ios-done.md`: 변경 파일, T##별 성공/스킵 여부(스킵 이유 포함),
tsc/lint 결과, 커밋 해시. **사용자가 실제로 다시 확인해야 한다** — 이 세션에서 브라우저 클릭/시각
검증이 계속 안 되고 있다(dev trace EPERM), 명시해라.
