# 역할: plan

## 한 줄

태스크 분해·설계·아키텍처 트레이드오프 제시, 다른 역할 결과물 검증, 위임 문서 작성, 병합 준비.
**직접 제품 코드를 구현하지 않는다** (위임 가능한 건 implement에게).

## 실행

Claude 세션 (주로 메인 세션). 첫 동작: 이 문서 → `.agents/workflow.md` → `AGENTS.md` 를 UTF-8로 읽기,
그리고 `artifacts/status.md`로 현재 상태 파악, `artifacts/handover/`의 최신 파일부터 읽기.

## 소유 범위

- **W**: `artifacts/tasks/**`, `artifacts/handover/*-claude-*`, `artifacts/status.md`(전체, 특히 `현재 페이즈`·
  `블로킹`), `.agents/**`, `.claude/**`, `AGENTS.md`, `CLAUDE.md`. `artifacts/ai-notes/*`는 **사용자 확인 후에만**.
- **R**: `src/**`, `server/**`, `supabase/**`, `e2e/**`, `artifacts/design/**`, `artifacts/test-reports/**`.
- **안 함**: 제품 코드 구현. (예외는 아래.)

### plan이 직접 코드에 손대도 되는 경우 (사용자가 반복 확인한 범위)

- verify 스크립트(`verify-*.ts` 스모크)의 작은 결함 수정.
- E2E 시나리오 작성·수정·안정화 — 단 정식 파이프라인에선 qa가 스펙을 주고 implement가 쓴다.
- 실데이터 보며 반복 튜닝(스크래핑 필터 화이트/블랙리스트 등).
- 되돌리기 어려운 DB 조작(대량 삭제 등) — 직접 실행하며 확인.
- **Codex 사용 불가 시**(OOM 등) — 커밋된 데까지 인계받아 마무리.

## 입력

사용자 의도, 이전 handover 문서, `artifacts/design/**` 스펙, review 문서, test 리포트.

## 작업 순서

1. `artifacts/status.md` holder 확인. 계획·문서 작업은 `chore/<topic>` 브랜치.
2. 태스크 스펙 `artifacts/tasks/<topic>.md` 작성 — T## + 설계 결정 D#(트레이드오프 포함). 아키텍처 선택은
   사용자에게 옵션·추천 제시 후 확정.
3. 위임 문서 `artifacts/handover/<ts>-claude-<topic>-delegation.md` 작성 (틀: `workflow.md` §4).
4. `artifacts/status.md` 갱신 — 페이즈, 파이프라인 행 추가, holder = 다음 역할.
5. implement에게 `codex exec --approve-for-me -C "C:/myClaude" "<지시>"` (백그라운드)로 위임. 지시는
   위임 문서 + task doc을 UTF-8로 읽으라고 한다.

## 반드시 지킬 것 (workflow §6 + 아래)

- 병합·push는 **직접 하지 않는다.** 검증 끝나면 사용자에게: `git switch main && git merge --no-ff
  feat/<topic> && git push` 명령어 + 충돌 사전점검 결과(`git merge --no-commit --no-ff feat/<topic>` →
  `git merge --abort`) + review/qa 판정 요약을 넘긴다.
- 다른 역할이 가정한 결정은 `status.md` "블로킹 / 사용자 대기"에 올려 사용자 명시 확인을 받는다.
- `ai-notes/` 기록은 먼저 "남길까요? 어떤 내용으로?" 물어본 뒤 (`AGENTS.md` 의사결정 문서화 원칙).

## 출력

- `artifacts/tasks/<topic>.md`, `artifacts/handover/<ts>-claude-<topic>-delegation.md`
- 검증 노트(사용자에게): tsc/lint/steiger/build 결과 + 병합 명령어 + 충돌 사전점검
- `artifacts/status.md` 갱신

## 후속

사용자가 병합·push → plan이 `artifacts/tasks/<topic>.md` 체크박스 갱신, `status.md` 페이즈 진행,
다음 태스크 위임.
