# AGENTS.md

이 저장소에서 AI 코딩 도구(Claude Code, Codex CLI 등)로 작업할 때 지켜야 할 공통 지침이다. 어떤 도구를 쓰든 이 파일을 기준으로 동작한다.

## 폴더 구조

- `ai-notes/` — 의사결정 로그, 오류 해결 로그 등 세션별 기록.
- `handover/` — 세션 인수인계 전용. 매 인수인계마다 새 md 파일을 만든다. 파일명 형식: `YYYY-MM-DD-HH-MM-에이전트이름-작업카테고리.md` (예: `2026-08-26-16-10-claude-api-connect.md`)
- `artifacts/design/` — design 역할의 산출물: `design-system.md`(리빙 스펙), `screens/<screen>.md`(화면별 리스타일 스펙), `mockups/`(목업 링크).
- `artifacts/status.md` — 상태 보드. 지금 트리를 누가 어느 브랜치로 점유 중인지 + 파이프라인 진행. 제자리 덮어쓰기.
- `.agents/` — 각 에이전트 역할 지침서. `README.md`(로스터·소유권 매트릭스), `workflow.md`(공통 조정 규약), 역할별 `plan.md`/`implement.md`/`design.md`/`code-review.md`/`qa.md`. `.agents/notes.md`는 사용자가 직접 노트를 남기는 용도. AI는 이 폴더를 임의로 정리·이동·삭제하지 않는다.

## 의사결정 문서화 원칙

1. 논의 끝에 결론이 나와도 **바로 기록하지 않는다.** 먼저 사용자에게 "이거 노트에 남길까요? 어떤 내용으로 남길까요?"라고 물어보고, 확인을 받은 뒤에 기록한다.
2. 기존 로그 파일에 이어쓰지 않는다. **기록할 내용이 생길 때마다 그 내용을 대표하는 제목의 새 md 파일**을 `ai-notes/`에 만든다. 문서 첫 줄에는 생성 날짜와 시간(예: 2026-08-26 pm11:00)을 표시한다.
3. 기록할 때는 짧은 불렛 형식으로만 남긴다. 긴 문단 설명 금지. 기본 틀:
   - 결정:
   - 이유: (간략하게)
   - 기각한 대안: (있는 경우만, 한 줄)
4. AI와 협업 중 발생한 문제(AI는 문제로 인식하지 않았더라도 사용자 기준에서 조정이 필요했던 경우 포함)를 해결한 과정도 같은 방식(먼저 기록 여부·범위 확인 → 불렛 요약 → 새 파일)으로 남긴다.
5. **노트 파일이든 다른 무엇이든, 사용자가 명시적으로 요청하지 않은 파일 생성/수정/이동/삭제를 먼저 하지 않는다.** 애매하면 만들기 전에 반드시 먼저 질문한다. 폴더나 파일의 용도가 확실하지 않으면 추측해서 정리하지 말고 먼저 물어본다.

## 세션 인수인계 (Claude Code ↔ Codex CLI)

- 세션이 끝나기를 기다리지 말고, 작업이 어느 정도 진행되거나 중요한 판단이 생길 때마다 `handover/`에 새 md 파일을 만들어 남긴다. 파일명: `YYYY-MM-DD-HH-MM-에이전트이름-작업카테고리.md`
- SessionEnd 훅(`scripts/hooks/session_end.py`)이 세션 종료 시 자동으로 `handover/`에 같은 형식의 파일을 남긴다(카테고리: `session-end`).
- 새 세션을 시작하면 `handover/`에서 가장 최근 파일을 먼저 읽고 이어서 작업한다.

## 협업 원칙

- 아키텍처·뼈대에 관한 중요한 의사결정권은 사용자 본인에게 있다. Claude는 선택지와 트레이드오프를 제시하고 추천하되, 최종 선택은 사용자가 한다.
- 코드 작성은 필요에 따라 다른 AI(Codex, Gemini 등)에게 위임할 수 있다.
- 이 프로젝트의 핵심 목표는 특정 기능·기술 구현이 아니라, AI에게 작업을 맡겼을 때 발생하는 문제(AI가 인식하지 못해도 사용자 기준에서 문제인 경우 포함)를 어떻게 포착하고 해결해나갔는지의 과정 자체다.

## 다중 에이전트 워크플로

2026-09-10 확정. 이전 2역할(Claude 계획 / Codex 구현)을 5역할로 확장. 정본은 `.agents/` — 어떤 역할을 맡든 `.agents/<role>.md` + `.agents/workflow.md`를 먼저 읽는다.

- **plan** (Claude 세션) — 스펙·설계·검증·병합 준비.
- **implement** (Codex, `codex exec --approve-for-me` 백그라운드) — 전체 제품 코드. 구현자는 하나로 유지.
- **design** (Claude 세션 + `design` 스킬) — 디자인 시스템 + 화면별 시각 스펙. 화면 파일은 안 건드리고 스펙만.
- **code-review** (Claude 세션 + `/code-review`) — `feat/*` diff 리뷰. 리뷰 문서만 쓴다.
- **qa** (Claude 세션 + Playwright) — E2E·반응형·다크·safe-area·build 게이트. 테스트 리포트만 쓴다.

규칙:
- 역할 지침서는 `.agents/<role>.md` 한 곳. `.claude/agents/` 서브에이전트는 안 쓴다(worktree 격리를 안 하면 이점 없음).
- git 격리 = **브랜치별, 단일 작업 폴더**. worktree 안 씀. `artifacts/status.md`가 트리 점유 보드.
- **heavy Node 프로세스는 한 번에 1개** (`codex exec` / `pnpm build` / `pnpm dev`+`test:e2e` 상호 배타).
- `main` 병합·push는 **전부 사용자만**. 에이전트는 `feat/<topic>` 브랜치만 남기고, plan이 병합 명령어 + 충돌 사전점검을 준다.
- 인계: `artifacts/handover/`의 산문 문서(위임/progress/done/blocked/review) + `artifacts/status.md` 보드.
- 아키텍처 결정은 사용자. `.agents/`는 AI가 재정리하지 않는다.
