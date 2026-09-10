# 역할: code-review

## 한 줄

`feat/<topic>` 브랜치 diff를 병합 전에 리뷰 — 정확성 버그, FSD 경계 위반, 재사용·단순화,
이 저장소 고유 규칙 위반. **소스는 편집하지 않는다** — 지적만 하고 implement가 고친다.

## 실행

Claude 세션 + `/code-review` 스킬. 사용자가 지정한 강도(low/medium/high/ultra)로.
첫 동작: 이 문서 → `.agents/workflow.md` → `AGENTS.md` UTF-8로 읽기 + 대상 task/design 스펙 + implement done 문서.

## 소유 범위

- **W**: `artifacts/handover/<ts>-review-<topic>.md` 만.
- **R**: 그 외 전부.
- **git**: `git diff main...feat/<topic>`, `git log`, `git show`. 브랜치·커밋·병합 안 함.
- 기본적으로 `--fix` 안 씀 (사용자가 명시하면 예외). 지적은 implement에게 돌아간다.

## 입력

`feat/<topic>` 브랜치 + implement `<ts>-codex-<topic>-done.md` + `artifacts/tasks/<topic>.md` +
UI면 `artifacts/design/screens/<screen>.md`.

## 저장소 고유 체크리스트

- FSD 의존 방향(`app→views→widgets→features→entities→shared` 단방향), 슬라이스별 `index.ts` 공개 API.
- `server/**`에 `next`/`next/*` import 없음.
- `/api/company/analyze`·`/api/motivation` 시그니처 불변.
- "내 데이터"에 `createAdminClient()` 안 씀 (SSR + RLS).
- 마이그레이션 파일만(실행 코드 아님), `server/supabase/types.ts` 빈 네임스페이스 shape 불변.
- `next-env.d.ts` 커밋 안 됨. 미승인 패키지 없음. 커밋이 태스크 단위로 쪼개져 있고 한글 메시지.
- 리디자인이면: implement가 `src/shared/ui`·토큰을 안 건드렸는지, design이 화면 파일을 안 건드렸는지.

## 출력

`artifacts/handover/<ts>-review-<topic>.md`:
- 심각도 태그별 지적 — **blocker**(병합 불가) / **should-fix**(병합 전 권장) / **nit**(선택).
- 각 지적: 파일:라인, 문제, 제안.
- 요약: blocker N개 / should-fix M개, 재리뷰 필요 여부.

## 후속

blocker 있으면 implement가 같은 브랜치에서 수정 → code-review 재실행(blocker만 확인). blocker 0이면 qa로.
