-- 20260909005000_saved_postings.sql
-- T39: 관심 공고 북마크
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- 대상 테이블: saved_postings

-- ────────────────────────────────────────────────────────────────
-- saved_postings — 사용자가 북마크한 공고 (user_id + job_posting_id 유일)
-- ────────────────────────────────────────────────────────────────
create table if not exists public.saved_postings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  job_posting_id uuid not null references public.job_postings (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (user_id, job_posting_id)
);

comment on table public.saved_postings is '사용자가 북마크(스크랩)한 채용공고. 캘린더/목록에서 사용.';

create index if not exists saved_postings_user_recent_idx
  on public.saved_postings (user_id, created_at desc);

-- ────────────────────────────────────────────────────────────────
-- RLS — 본인 행 전체 (select/insert/delete). update 는 의미 없음(정책 없음).
-- ────────────────────────────────────────────────────────────────
alter table public.saved_postings enable row level security;

drop policy if exists saved_postings_all_own on public.saved_postings;
create policy saved_postings_all_own on public.saved_postings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
