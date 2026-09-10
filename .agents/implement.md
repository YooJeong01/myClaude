# 역할: implement

## 한 줄

전체 제품 코드 구현. feature/server/action/widget/entity/route — 전부 하나의 역할이다
(client/server/action 으로 쪼개지 않는다).

## 실행

Codex CLI. plan이 `codex exec --approve-for-me -C "C:/myClaude" "<지시>"` (백그라운드)로 구동.
첫 동작: 위임 문서와 `artifacts/tasks/<topic>.md`, `.agents/workflow.md`, `AGENTS.md`를
**`Get-Content -LiteralPath ... -Encoding UTF8`** 로 읽는다 (기본 인코딩은 한글이 깨진다).

## 소유 범위

- **W**: `src/**`(모든 레이어 — `features/*/ui`, `widgets/*/ui`, `views/**` 포함), `server/**`,
  `app/**` 라우트, `supabase/migrations/**`(파일만, 실행 안 함), `e2e/**`, Day 8 셸 파일
  (`capacitor.config.ts`, `src-tauri/**`, `ios/**`, `android/**`), `package.json`(스펙이 명시한 패키지만).
- **R**: `artifacts/**`(자기 progress/done/blocked 제외), `.agents/**`, `artifacts/design/**`(소비).
- **안 만짐**: `src/shared/ui/**`, `src/app/globals.css`, `tailwind.config.ts`, `src/shared/lib/utils.ts`의
  `cn` — 리디자인 페이즈에는 design 소유. 오프-페이즈에 프리미티브가 꼭 필요하면 디자인 시스템 스펙의
  토큰·variant 관례를 따라 **추가만** 하고 done 문서에 명시.

## 입력

`artifacts/tasks/<topic>.md`(정본) + `artifacts/handover/<ts>-claude-<topic>-delegation.md` +
화면 리스타일이면 `artifacts/design/screens/<screen>.md` + `artifacts/design/design-system.md`.

## 작업 순서

1. 위임받은 `feat/<topic>` 브랜치를 `main`에서 만들거나 스위치 (`status.md` holder 확인).
2. task doc의 T##를 **의존성 순서대로**. 태스크마다:
   - 구현 → `pnpm exec tsc --noEmit` + `pnpm lint` 그린 → `[feat]`/`[chore]` 한글 커밋.
   - `artifacts/handover/<ts>-codex-<topic>-progress.md`에 한 줄 이어쓰기(커밋 해시 + 요약).
3. 끝나면 `artifacts/handover/<ts>-codex-<topic>-done.md` 작성.

## 반드시 지킬 것 (workflow §6 + 아래)

- **`main` 병합·push 절대 안 함.** `feat/<topic>` 브랜치만 남긴다.
- "내 데이터" 조회·쓰기는 SSR 클라이언트 + RLS 로만. `createAdminClient()`는 verify 스크립트·기존
  analyze 라우트 한정. 세션은 `getUser()`/`requireUser()` 이음새로만.
- 보호 페이지는 `app/(app)/dashboard/...` 하위. 미들웨어 매처 건드리지 않음.
- 기존 API 라우트(`/api/company/analyze`, `/api/motivation`) **시그니처 변경 금지** — 호출만.
- `next-env.d.ts` 커밋 전 되돌린다.
- 애매하면 `blocked` 문서 남기고 종료 (야간 자율 세션이면: 전체 중단 대신 blocked 노트 남기고 다음 태스크로).

## 출력

- `feat/<topic>` 브랜치, 태스크별 한글 커밋
- `<ts>-codex-<topic>-progress.md` (이어쓰기), `<ts>-codex-<topic>-done.md`:
  태스크별 생성/수정 파일 · 새 패키지·env · tsc/lint/build 결과 · verify·E2E 결과(마이그레이션 전이면 명시)
  · 태스크별 커밋 해시 · 스펙 이탈 + 이유 · 미해결·주의

## 후속

code-review → (blocker면 같은 브랜치에서 수정 → 재리뷰) → qa → (결함이면 수정 → qa 재실행) →
plan 최종 검증 → 사용자 병합.
