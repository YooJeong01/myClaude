수정 완료했습니다.

핵심 변경:
- [form.tsx](C:/myClaude/src/features/add-job-posting/ui/form.tsx)에서 서버 액션 직접 import 제거
- [DashboardView](C:/myClaude/src/views/dashboard/index.tsx)가 `submitJobPosting` 서버 액션을 `submitAction` prop으로 주입
- `@/shared/api` barrel에서 server Supabase export 제거
- 서버 전용 public API로 [src/shared/api-server/index.ts](C:/myClaude/src/shared/api-server/index.ts) 추가
- 미인증 `/dashboard` 접근은 `getUser()` 후 `redirect("/")`로 307 보장
- lint를 막던 [verify-job-posting.ts](C:/myClaude/server/jobs/verify-job-posting.ts)의 미사용 import 제거

검증:
- `corepack pnpm lint` 통과
- `curl http://localhost:3000/` → `200`
- `curl -i http://localhost:3000/dashboard` → `307 Temporary Redirect`, `location: /`

참고:
- 이 환경에서 새로 `corepack pnpm dev`를 실행하면 `spawn EPERM`으로 실패했습니다.
- 다만 이미 `C:\myClaude`의 Next dev 서버가 `localhost:3000`에서 실행 중이어서 그 서버로 실제 HTTP 검증을 완료했습니다.
- 요청하신 “이 파일”로 보이는 `.codex/webpack-fix-run.log`는 현재 권한상 읽기 전용이라 결과 요약을 파일에 쓰지는 못했습니다.