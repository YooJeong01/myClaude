/**
 * DB 스키마 타입 재노출.
 *
 * 원본은 `server/supabase/types.ts` (런타임 무관 도메인 계약).
 * `src/` 코드는 이 shared 경로로만 임포트한다.
 */
export type { Database, Json } from "@server/supabase/types";
