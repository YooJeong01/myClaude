# T2 Supabase 스모크 테스트 완료

- 2026-08-30 15:16
- 도구: codex
- 작업:
  - `.env.local`의 Supabase URL, anon 키, service-role 키 설정 확인
  - service-role 관리자 클라이언트로 `auth.admin.listUsers({ page: 1, perPage: 1 })` 호출 성공
  - anon 키로 `/auth/v1/settings` 호출 성공
  - `artifacts/tasks/day1.md` T2-4, T2-5 상태 갱신
- 결과:
  - T2는 DB 스키마 작성 전 가능한 범위에서 완료
  - DB 테이블 `select` 검증은 T3 스키마 생성 후 진행
- 주의:
  - 사용자가 앞으로 삭제 명령 실행 전 허락을 받으라고 요청함
