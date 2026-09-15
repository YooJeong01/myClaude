# T2 Supabase 연결 작업 인수인계

- 2026-08-30 15:12
- 도구: codex
- 작업:
  - `@supabase/ssr@0.7.0`, `@supabase/supabase-js@2.75.0` 설치
  - `src/shared/api/supabase/client.ts` 추가
  - `src/shared/api/supabase/server.ts` 추가
  - `src/shared/api/supabase/middleware.ts` 추가
  - `server/supabase/admin.ts` 추가
  - `.env.local` 생성
  - `artifacts/tasks/day1.md` T2 상태 갱신
- 검증:
  - `pnpm exec tsc --noEmit` 통과
  - T2 관련 파일 ESLint 통과
- 대기:
  - `.env.local` 실제 Supabase 값 입력 필요
  - 값 입력 후 `src/shared/api/supabase/server.ts` 기반 select 스모크 테스트 필요
- 참고:
  - 최신 Supabase 패키지는 Node 22 이상 요구 하위 패키지를 포함해, 현재 로컬 Node 20.14.0 기준 호환 버전으로 고정함
