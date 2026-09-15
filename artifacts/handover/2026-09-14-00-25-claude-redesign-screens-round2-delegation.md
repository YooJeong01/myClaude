# 화면 리스타일 2차 라운드 위임 (Codex) — 야간 자율 세션

- 2026-09-14 00:25
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: **`artifacts/tasks/redesign.md`의 "2차 라운드 T## (T6~T10)"이 정본.** 각 T##가 가리키는
  `artifacts/design/screens/<screen>.md`를 UTF-8로 읽어라 (`Get-Content -LiteralPath ...
  -Encoding UTF8`). `.agents/implement.md`, `.agents/workflow.md`, `AGENTS.md`도 같은 방식으로 읽어라.

## 상황 — 사용자가 자는 동안 진행

사용자가 잠든 사이 진행하는 야간 세션이다. **막히는 태스크가 나와도 전체를 멈추지 마라** — 그 태스크만
`artifacts/handover/<ts>-codex-<topic>-blocked-T#.md`로 상황·선택지를 남기고 다음 T##로 넘어가라.
전부 끝나거나 전부 막히면 그때 완료/중단 보고를 남기고 종료해라.

## 작업 범위

`artifacts/tasks/redesign.md`의 T6~T10 그대로:

1. **T6 experiences** (먼저 — 다른 태스크의 선행) — 신규 `src/shared/ui/{input,textarea}.tsx` 프리미티브
   생성(`experiences.md` "신규 프리미티브" 절에 정확한 스펙 있음: 토큰명, `_focus`/`_disabled` 상태,
   `<select>`는 별도 컴포넌트 없이 `input.tsx`가 export하는 스타일 객체 재사용) + 경험 관리 화면 적용.
2. **T7 login** — 스펙: `screens/login.md`. OAuth 버튼은 추가하지 마라(스펙의 "아래 여지" 절은 나중을
   위한 메모, 지금 범위 아님).
3. **T8 analyses-index** — 스펙: `screens/analyses-index.md`.
4. **T9 job-postings** — 스펙: `screens/job-postings.md`. `add-job-posting`/`search-job-postings`/
   `toggle-saved-posting`/`run-analysis-button` 4개 파일.
5. **T10 analysis-history** — 스펙: `screens/analysis-history.md`.

T8~T10은 T6만 끝나면 서로 독립적 — 순서 바꿔도 되지만 순차로 진행해라.

## 반드시 지킬 것

`.agents/workflow.md` §6 전체. 추가로:
1. 같은 브랜치(`feat/design-system`)에 이어서, **T##마다 커밋**, `[feat]` 한글 메시지.
2. 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린 — **다음 태스크로 넘어가기 전에 매번 확인**
   (한 태스크가 깨진 채로 다음 태스크를 쌓지 마라).
3. **여전히 병합 요청하지 마라.**
4. `Input`/`Textarea` 프리미티브는 `button.tsx`/`card.tsx`/`tag.tsx`와 같은 패턴(Panda `css`/`cva`,
   `React.forwardRef`, `cn`으로 className 병합, FSD `src/shared/ui/`에만).
5. 새 패키지 추가 없음 — 전부 기존 프리미티브 패턴 재사용으로 가능한 범위다. 뭔가 새 패키지가 꼭
   필요할 것 같으면 멈추고 blocked 문서.
6. 스펙에 없는 판단이 필요하면(예: 특정 텍스트 색이 애매함) 스펙의 "비슷한 이미 처리된 사례"를
   최대한 따라가되, 정 애매하면 그 항목만 스킵하고 blocked 메모 남기고 계속 진행해라 — 전체를 막지
   마라.

## 완료(또는 부분 완료) 시 보고

`artifacts/handover/<ts>-codex-redesign-screens-round2-done.md`:
- T##별 생성/수정 파일, 성공/블락 여부
- tsc/lint 결과 (T##별)
- 새로 만든 `Input`/`Textarea` 프리미티브 요약
- **"병합 보류 — 사용자 기상 후 최종 검증·리뷰 필요"** 명시
- 커밋 해시 목록, 스펙 이탈 + 이유, 미해결·주의
- 만약 usage limit이나 OOM으로 도중에 중단되면 그 시점까지 커밋된 것만으로도 괜찮다 — 억지로 이어가지
  말고 중단 사실만 명확히 남겨라(다음에 plan이나 Haiku 서브에이전트가 이어받는다, `.agents/workflow.md`
  §7 참고).
