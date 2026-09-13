# .agents/ — 역할 지침서

이 폴더는 `AGENTS.md`가 선언한 "여러 에이전트를 운용할 때 각 에이전트에게 부여할 역할 지침서"의 정본이다.
어떤 도구(Claude Code 세션, Codex CLI)로 그 역할을 수행하든 해당 `<role>.md`가 기준이다.

## 역할 로스터

| 역할 | 실행 방법 | 한 줄 |
|---|---|---|
| [plan](plan.md) | Claude 세션 (주로 메인) | 스펙·설계·검증·병합 준비 |
| [implement](implement.md) | Codex (`codex exec --approve-for-me`, 백그라운드) | 전체 제품 코드 |
| [design](design.md) | Claude 세션 (별도 터미널 또는 메인 겸임) + `design` 스킬 | 디자인 시스템 + 시각 레이어 스펙 |
| [code-review](code-review.md) | Claude 세션 + `/code-review` 스킬 | `feat/*` diff 리뷰 |
| [qa](qa.md) | Claude 세션 + Playwright | E2E·반응형·다크·safe-area·build 게이트 |

공통 조정 규약(브랜치·상태 보드·인계·병합)은 [workflow.md](workflow.md)에 있다.

## 소유권 매트릭스

W = 이 역할만 쓴다 / R = 읽기만 / – = 관여 안 함

| 경로 | plan | implement | design | code-review | qa |
|---|---|---|---|---|---|
| `artifacts/tasks/**` | **W** | R | R | R | R |
| `artifacts/handover/*-claude-*` | **W** | R | R | R | R |
| `artifacts/handover/*-codex-*` | R | **W** | – | R | R |
| `artifacts/handover/*-review-*` | R | R | – | **W** | R |
| `artifacts/design/**` | R | R | **W** | R | R |
| `artifacts/test-reports/**` | R | R | R | R | **W** |
| `artifacts/status.md` | **W** (페이즈·블로킹) | W (자기 행) | W (자기 행) | W (자기 행) | W (자기 행) |
| `src/shared/ui/**`, `src/app/globals.css`, `panda.config.ts` | R | R (오프-페이즈 add-only) | **W** (리디자인 페이즈) | R | R |
| `src/features\|widgets\|views/**`, `app/**` | R | **W** | R (읽기만) | R | R |
| `server/**`, `supabase/migrations/**`, `e2e/**` | R | **W** | – | R | R |
| `.agents/**`, `.claude/**`, `AGENTS.md`, `CLAUDE.md` | **W** | – | – | – | – |
| `main` 병합 / push | – | – | – | – | **사용자만** |

`.agents/notes.md`는 사용자 전용 — AI가 건드리지 않는다.

## `.claude/agents/` 서브에이전트를 안 쓰는 이유

Claude Code 서브에이전트는 기본적으로 부모와 같은 작업 폴더·브랜치를 공유한다(별도 문맥창일 뿐
파일시스템 격리가 아님). `isolation: "worktree"` 옵션은 있으나 이 프로젝트는 worktree를 안 쓰기로 했고
(호스트 RAM ~1GB), heavy 프로세스가 어차피 직렬이라 병렬 디스패치 이득도 없다. 따라서 역할은
서브에이전트가 아니라 별도 세션 / 메인 세션 겸임 / Codex 로 실행한다. 나중에 스코프가 좁은 리뷰를
서브에이전트로 돌리는 게 유용해지면 그때 `.claude/agents/<role>.md`에 이 문서를 가리키는 얇은 포인터를
추가한다.
