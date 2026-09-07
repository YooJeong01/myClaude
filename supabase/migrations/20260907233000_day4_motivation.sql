-- 20260907233000_day4_motivation.sql
-- T24: 지원동기 매칭용 사용자 경험 + 지원동기 초안 이력
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- 대상 테이블: user_experiences / motivation_drafts

create extension if not exists moddatetime schema extensions;

-- ────────────────────────────────────────────────────────────────
-- 1. user_experiences — 사용자 소유, 편집 가능
-- ────────────────────────────────────────────────────────────────
create table if not exists public.user_experiences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_experiences is '지원동기 매칭에 쓰는 사용자 개인 경험. 사용자별 소유, 편집 가능.';

create index if not exists user_experiences_user_recent_idx
  on public.user_experiences (user_id, created_at desc);

drop trigger if exists user_experiences_set_updated_at on public.user_experiences;
create trigger user_experiences_set_updated_at
  before update on public.user_experiences
  for each row execute procedure extensions.moddatetime (updated_at);

-- ────────────────────────────────────────────────────────────────
-- 2. motivation_drafts — 사용자 소유, 불변 이력
-- ────────────────────────────────────────────────────────────────
create table if not exists public.motivation_drafts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  company_analysis_id uuid not null references public.company_analyses (id) on delete restrict,
  job_posting_id      uuid references public.job_postings (id) on delete set null,
  experience_ids      uuid[] not null default '{}',
  result              jsonb not null,
  model               text,
  created_at          timestamptz not null default now()
);

comment on table public.motivation_drafts is '기업분석과 개인 경험을 매칭해 만든 지원동기 소재 초안. 덮어쓰지 않는 이력.';

create index if not exists motivation_drafts_lookup_idx
  on public.motivation_drafts (user_id, company_analysis_id, created_at desc);

-- ────────────────────────────────────────────────────────────────
-- 3. RLS
-- ────────────────────────────────────────────────────────────────
alter table public.user_experiences enable row level security;
alter table public.motivation_drafts enable row level security;

-- user_experiences: 본인 행 전체(select/insert/update/delete).
drop policy if exists user_experiences_all_own on public.user_experiences;
create policy user_experiences_all_own on public.user_experiences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- motivation_drafts: 본인 읽기 + 본인 삽입. update/delete 정책 없음(불변 이력).
drop policy if exists motivation_drafts_select_own on public.motivation_drafts;
create policy motivation_drafts_select_own on public.motivation_drafts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists motivation_drafts_insert_own on public.motivation_drafts;
create policy motivation_drafts_insert_own on public.motivation_drafts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
