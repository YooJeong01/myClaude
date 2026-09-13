# 세션 갱신 버그 수정 위임 (Codex)

- 2026-09-13 19:19
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 스펙: 이 문서가 정본이다. `.agents/implement.md`, `.agents/workflow.md`, `AGENTS.md`도 같은 방식으로
  UTF-8 읽어라 (`Get-Content -LiteralPath ... -Encoding UTF8`, 기본 인코딩은 한글이 깨진다).

## 상황

사용자가 "브라우저를 여닫을 때마다 로그인해야 한다"고 보고함. 원인 분석 결과:
`src/shared/api/supabase/middleware.ts:36`가 `supabase.auth.getClaims()`로 인증 여부를 판단하는데,
`getClaims()`는 **로컬 JWT 서명·만료만 검사하고 refresh token으로 갱신을 시도하지 않는다.**
access token 기본 수명(1시간)이 지나면 refresh token이 멀쩡해도 미인증으로 판정돼 `/`로 리다이렉트된다.

Supabase 공식 Next.js SSR 가이드는 미들웨어에서 정확히 이 이유로 `getUser()`를 쓰라고 명시한다 —
`getUser()`는 Auth 서버에 검증 요청을 보내면서 만료된 토큰을 갱신하고 쿠키에 다시 쓴다.
(참고: https://supabase.com/docs/guides/auth/server-side/nextjs)

`grep`으로 확인한 결과 `getClaims()` 호출은 저장소 전체에서 이 한 곳뿐이다(`src/entities/session/model.ts`의
`getUser()` 헬퍼 등 나머지는 이미 `supabase.auth.getUser()`를 올바르게 쓰고 있음).

## 작업 범위

**T1.** `src/shared/api/supabase/middleware.ts`의 인증 체크를:
```ts
const { data } = await supabase.auth.getClaims();
const claims = data?.claims ?? null;

if (request.nextUrl.pathname.startsWith("/dashboard") && !claims) {
```
→ `supabase.auth.getUser()` 기반으로 교체 (Supabase 공식 가이드 패턴 그대로):
```ts
const {
  data: { user }
} = await supabase.auth.getUser();

if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
```
- 변수명(`claims`→`user` 등) 자유롭게 정리해도 됨. 다른 로직(쿠키 `setAll`, redirect 대상 `/`)은 그대로.
- **시그니처·매처(`config.matcher`) 변경 금지.**

**T2.** 회귀 확인: `e2e/`의 로그인 fixture(day5 T34, `generateLink({ type: "magiclink" })` → `/auth/confirm`
진입)를 참고해서, **access token 만료 이후에도 세션이 유지되는지** 검증하는 시나리오를 추가하거나
기존 시나리오에 확인 포인트를 넣어라. 실제로 1시간을 기다릴 수 없으니, 다음 중 가능한 방법으로:
- Supabase 로컬/테스트 프로젝트의 JWT 만료 시간을 테스트용으로 짧게 설정할 수 있으면 그렇게 해서 재현.
- 여의치 않으면 최소한 기존 로그인 E2E 회귀(9/9)가 깨지지 않는 것만 확인하고, done 문서에
  "만료 후 갱신 시나리오는 자동화 안 됨 — 수동 확인 필요"라고 명시해라. 애매하면 멈추고 blocked 문서.

## 레퍼런스

- `src/entities/session/model.ts` — 이미 올바른 `getUser()` 사용 패턴 (`getUser()`/`requireUser()`).
- `artifacts/handover/2026-09-08-21-15-claude-day5-report-ui-delegation.md` — 매직링크 로그인 fixture 설명.

## 반드시 지킬 것

`.agents/workflow.md` §6 전체 적용. 추가로:
1. 브랜치는 이미 파둔 `fix/session-refresh` (`chore/agent-workflow-setup` 기준) 그대로 사용 — 새로 만들지 마라.
2. 이 수정은 **딱 1줄 로직 교체**다. 범위 넓히지 마라 (다른 리팩터링·타입 변경 금지).
3. 커밋 전 `pnpm exec tsc --noEmit` + `pnpm lint` 그린.
4. 새 패키지 추가 없음.

## 완료 시 보고

`artifacts/handover/<ts>-codex-session-refresh-done.md`:
- 변경 파일 diff 요약
- tsc/lint 결과
- E2E 결과(9/9 유지 여부, T2 만료-후-갱신 시나리오 자동화 여부)
- 커밋 해시
