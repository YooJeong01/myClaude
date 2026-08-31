# supabase/

DB 스키마 마이그레이션. **Supabase CLI 를 쓰지 않는다** — 대시보드 SQL Editor 로 직접 실행한다.

## 마이그레이션 실행

1. Supabase 대시보드 > **SQL Editor** 열기.
2. `migrations/` 에서 아직 적용 안 한 파일을 **파일명 순서대로** 하나씩 연다.
3. 파일 전체를 붙여넣고 **Run**.
4. 대시보드 **Table Editor** / **Authentication > Policies** 에서 테이블·정책 생성 확인.

`migrations/*_init.sql` 은 `create ... if not exists` / `drop policy if exists` 로 작성돼 재실행해도 깨지지 않지만,
**스키마 변경은 기존 파일을 고치지 말고 새 마이그레이션 파일을 추가**한다 (`YYYYMMDDHHMMSS_설명.sql`).

## 사전 확인

- `20260830155347_init.sql` 은 `unique nulls not distinct` (Postgres 15+) 를 쓴다.
  프로젝트 PG 버전을 **Settings > Infrastructure** 에서 확인한다. 14 이하면 해당 제약을
  `create unique index ... (coalesce(...))` 표현식 인덱스로 바꿔야 한다.

## 타입 동기화

Supabase CLI(`supabase gen types`)를 쓰지 않으므로, 마이그레이션을 추가/수정할 때
`server/supabase/types.ts` 의 `Database` 타입을 **손으로** 맞춰준다.
`src/` 코드는 `@/shared/api/supabase/types` 로 재노출된 타입만 임포트한다.
