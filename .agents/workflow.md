# 공통 조정 규약

모든 역할이 공유하는 규칙. 역할별 세부는 각 `<role>.md`.

## 1. git 격리 — 브랜치별, 단일 작업 폴더

- 작업 폴더는 `C:\myClaude` 하나. `node_modules`·`.next`·dev 포트(3000) 1개를 공유한다. **worktree 안 씀**
  (호스트 RAM ~1GB — worktree마다 install/dev 서버가 필요해 동시 실행 불가).
- 작업 단위 = `feat/<topic>` 브랜치 (`main`에서 분기). 리뷰 수정은 같은 브랜치에 이어서.
- 브랜치 이름: `feat/design-system`, `feat/redesign-screens`, `feat/app-shells`(Day 8), `feat/day9-*` 등.
  구조·문서 작업은 `chore/<topic>`, 버그는 `fix/<topic>`.
- `git switch`는 **클린 트리에서만.** 중간 상태는 `git stash` 대신 `wip:` 커밋으로 남기고 나중에 squash.
- `next-env.d.ts`는 로컬 빌드로 계속 바뀐다 — **커밋 금지.** 커밋 전 `git checkout -- next-env.d.ts`.

## 2. 상태 보드 — `artifacts/status.md`

트리를 "지금 누가 어느 브랜치로 점유 중인지"와 파이프라인 진행을 한눈에 보는 곳. 제자리 덮어쓰기.

- 작업 시작 전: `작업 트리`의 `holder`가 비어 있는지 확인. 비어 있으면 자기 이름 + 브랜치로 채우고 시작.
- 한 홉(예: implement 한 태스크, review 1회)을 끝내면: 자기 파이프라인 셀 + `다음 액션` + 맨 위 타임스탬프 갱신.
- 인계할 때: `holder`를 비우거나 다음 역할로 바꾼다.
- `현재 페이즈`와 `블로킹 / 사용자 대기`는 **plan만** 쓴다.

## 3. heavy 프로세스는 한 번에 1개

`codex exec`(implement) / `pnpm build` / `pnpm dev` + `pnpm test:e2e`(qa) 는 상호 배타.
동시에 돌리지 않는다. 실제 병행 가능한 것: plan의 계획·스펙 작성(읽기 위주) + `design` 스킬(브라우저
아트보드) 이 Codex 구현 중에 도는 정도.

## 4. 인계 문서 — `artifacts/handover/`

기존 산문 인계 문서를 유지한다. 파일명: `YYYY-MM-DD-HH-MM-<에이전트>-<카테고리>.md`.

- **위임 (plan → implement)**: `<ts>-claude-<topic>-delegation.md`.
  틀: 헤더(타임스탬프 / 위임자·실행자 / 스펙 포인터 + `Get-Content -LiteralPath ... -Encoding UTF8` 노트)
  → 상황 → 작업 범위·순서(의존성 순서로 번호 매긴 T##, 각 줄에 정확한 대상 경로 + 하위 스펙 참조)
  → 레퍼런스("이 패턴을 그대로 따를 것" — 기존 파일) → 반드시 지킬 것(§6) → 진행 중간 보고 → 완료 시 보고.
- **진행 (implement)**: `<ts>-codex-<topic>-progress.md` — **유일하게 이어쓰기 허용** 파일. 태스크 커밋마다 한 줄.
- **완료 (implement)**: `<ts>-codex-<topic>-done.md` — 태스크별 생성/수정 파일, 새 패키지·env, tsc/lint/build
  결과, verify·E2E 결과(마이그레이션 전이면 명시), 태스크별 커밋 해시, 스펙 이탈 + 이유, 미해결·주의.
- **막힘 (아무 역할)**: `<ts>-<role>-<topic>-blocked.md` — 상황 + 선택지. 남기고 종료.
- **리뷰 (code-review)**: `<ts>-review-<topic>.md` — blocker / should-fix / nit 로 심각도 태그.

## 5. 태스크 수명

```
사용자 의도
  → plan: artifacts/tasks/<topic>.md (T## + 설계 결정 D#)
          + artifacts/handover/<ts>-claude-<topic>-delegation.md
          + status.md (페이즈, 파이프라인 행, holder = 다음 역할)
  ├─ UI 관여? → design: 목업(design 스킬) → design-system.md / screens/<screen>.md
  │             토큰·프리미티브 변경이면 feat/design-system 코드 → plan 검증 → 사용자 병합
  → implement (Codex): feat/<topic>, 태스크별 한글 커밋, 스펙 + 프리미티브 소비
          progress.md 이어쓰기, 끝에 done.md   (OOM 으로 죽으면 plan 이 마지막 커밋부터 인계)
  → code-review: git diff main...feat/<topic> + /code-review → <ts>-review-<topic>.md
          blocker 있으면 → implement 같은 브랜치에서 수정 → 재리뷰
  → qa: pnpm test:e2e + 반응형/다크/safe-area + pnpm build 게이트 → test-reports/<topic>.md
          결함 있으면 → implement 수정 → qa 재실행
  → plan: 최종 검증(tsc + lint + steiger + build) + 병합 명령어 + 충돌 사전점검
  → 사용자: git switch main && git merge --no-ff feat/<topic> && git push
          + artifacts/tasks/<topic>.md 체크박스 갱신 + 가정한 D# 확인
```

## 6. 반드시 지킬 것 (모든 역할 공통)

1. `feat/<topic>` (또는 `chore/`·`fix/`) 브랜치. 태스크(T##) 스텝별 `[feat]`/`[chore]`/`[fix]` **한글** 커밋.
2. **`main` 병합·push 금지.** 브랜치만 남긴다. 병합은 사용자.
3. 커밋 전: `pnpm exec tsc --noEmit` + `pnpm lint`(eslint + steiger — **FSD 경계 위반 0**) 그린.
   `pnpm build`는 RAM 여유 있을 때 확인, 안 되면 done/상태에 "build 미검증 — RAM" 명시.
4. FSD 단방향 의존: `app → views → widgets → features → entities → shared`. 슬라이스마다 `index.ts` 공개 API.
   `server/**`에 `next`/`next/*` import 금지.
5. 마이그레이션은 **파일만** 만든다 — 실행은 사용자. verify가 "테이블/컬럼 없음"으로 실패하면 코드
   버그가 아니라 "마이그레이션 미실행"이다. done 문서에 명시.
6. `server/supabase/types.ts`의 빈 네임스페이스 shape 건드리지 않는다.
7. 새 패키지는 스펙(task doc)이 명시적으로 승인한 것만. 그 외 필요하면 멈추고 물어본다.
8. `next-env.d.ts` 커밋 금지.
9. **애매하면 멈춘다.** task doc으로 판단이 안 서는 설계 선택이 나오면 억지로 정하지 말고
   `artifacts/handover/<ts>-<role>-<topic>-blocked.md`에 상황·선택지 남기고 종료.
10. 사용자가 명시적으로 요청하지 않은 파일 생성/이동/삭제를 먼저 하지 않는다 (`AGENTS.md` 원칙 5).

## 7. OOM 복구 패턴

이 호스트에서 `codex exec`·`pnpm build`가 가용 RAM 부족으로 자주 강제 종료된다.
`codex exec`가 태스크 중간에 죽으면: plan이 `git log feat/<topic>`으로 마지막 커밋을 확인하고, 거기서부터
직접 이어받아 마무리하거나 blocked 문서를 남긴다. 커밋된 데까지는 항상 복구 가능하도록 태스크별로 커밋.

## 8. 사용자 게이트

- ① 목업/시각 방향 승인 (파운데이션 코드 착수 전)
- ② 모든 `--no-ff` 병합 + push
- ③ 에이전트가 task doc에 없어 가정한 결정 → done 문서 "이탈/가정" + `status.md` "블로킹"에 노출해 명시 확인
- ④ 새 파일·패키지·마이그레이션 실행은 사전 질문
