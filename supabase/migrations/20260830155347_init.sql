-- 20260830155347_init.sql
-- T3: DB 스키마 v0 + RLS 초안
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- 대상 테이블: profiles / companies / job_postings / company_analyses
--
-- 주의:
--   * 이 스키마는 v0 초안이다. 이후 변경은 이 파일을 고치지 말고
--     supabase/migrations/ 에 새 파일을 추가한다.
--   * `unique nulls not distinct` 는 Postgres 15+ 문법이다.
--     실행 전 프로젝트 PG 버전을 확인한다 (대시보드 > Settings > Infrastructure).

-- ────────────────────────────────────────────────────────────────
-- 0. 확장
-- ────────────────────────────────────────────────────────────────
create extension if not exists moddatetime schema extensions;

-- ────────────────────────────────────────────────────────────────
-- 1. profiles — 사용자 1명당 1행. auth.users 앵커.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is '사용자 프로필. auth.users 와 1:1.';

-- 회원가입 시 profiles 행 자동 생성 (security definer → RLS 우회)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at 자동 갱신
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime (updated_at);

-- ────────────────────────────────────────────────────────────────
-- 2. companies — 전체 공유 레퍼런스. 기업당 1행. 쓰기는 service-role 만.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  corp_code   text not null unique,               -- DART 고유번호 8자리
  name        text not null,
  stock_code  text,                               -- 상장 종목코드 6자리 (비상장 null)
  industry    text,
  public_data jsonb not null default '{}'::jsonb,  -- DART 기업개황 등 유연 저장
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.companies is 'DART 기반 기업 공개정보. 모든 사용자가 공유. 쓰기는 서버(service-role)만.';

create index if not exists companies_name_idx on public.companies (name);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute procedure extensions.moddatetime (updated_at);

-- ────────────────────────────────────────────────────────────────
-- 3. job_postings — 사용자 소유. 수동 입력 + 이메일 파싱 수집.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.job_postings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  company_id       uuid references public.companies (id) on delete set null,
  company_name_raw text,
  company_key      text generated always as (lower(btrim(coalesce(company_name_raw, '')))) stored,
  role             text not null,
  role_norm        text generated always as (lower(btrim(role))) stored,
  employment_type  text not null default '기타',
  posted_at        date,
  deadline         date,
  source           text not null default 'manual',
  url              text,
  raw_text         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint job_postings_employment_type_check
    check (employment_type in ('정규직', '계약직', '인턴', '파견', '프리랜서', '기타')),
  constraint job_postings_source_check
    check (source in ('manual', 'email')),
  constraint job_postings_has_content
    check (url is not null or raw_text is not null),
  -- 중복 판정: 같은 사용자 + 회사명 + 직무 + 고용형태 + 게시일 이면 중복.
  -- nulls not distinct → null 값도 같은 것으로 취급 (Postgres 15+).
  constraint job_postings_dedup
    unique nulls not distinct (user_id, company_key, role_norm, employment_type, posted_at)
);

comment on table public.job_postings is '채용 공고. 사용자별 소유. company_id 는 Route Handler 가 회사 해석 후 채운다.';

create index if not exists job_postings_user_recent_idx
  on public.job_postings (user_id, created_at desc);
create index if not exists job_postings_company_idx
  on public.job_postings (company_id);

drop trigger if exists job_postings_set_updated_at on public.job_postings;
create trigger job_postings_set_updated_at
  before update on public.job_postings
  for each row execute procedure extensions.moddatetime (updated_at);

-- ────────────────────────────────────────────────────────────────
-- 4. company_analyses — 사용자 소유. 불변 이력 (덮어쓰기 없음).
-- ────────────────────────────────────────────────────────────────
create table if not exists public.company_analyses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  -- on delete restrict: 레퍼런스 데이터 정리로 사용자 분석 이력이 삭제되면 안 됨.
  company_id     uuid not null references public.companies (id) on delete restrict,
  role           text not null,
  role_norm      text generated always as (lower(btrim(role))) stored,
  job_posting_id uuid references public.job_postings (id) on delete set null,
  result         jsonb not null,                    -- AI 종합 결과 (구조는 3일차 확정)
  sources        jsonb not null default '{}'::jsonb, -- 출처: DART/뉴스/컨센서스 참조
  model          text,                              -- 사용한 모델 식별자
  created_at     timestamptz not null default now() -- 신선도 "N일 전" 표시용
);

comment on table public.company_analyses is '기업분석 결과. (user, company, role) 별 이력 누적. 수정/삭제 없음.';

create index if not exists company_analyses_lookup_idx
  on public.company_analyses (user_id, company_id, role_norm, created_at desc);

-- ────────────────────────────────────────────────────────────────
-- 5. RLS
-- ────────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.companies        enable row level security;
alter table public.job_postings     enable row level security;
alter table public.company_analyses enable row level security;

-- profiles: 본인만 read/update. insert 는 handle_new_user 트리거가 담당(정책 없음).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- companies: 로그인 사용자 읽기 전용. 쓰기 정책 없음 → service-role(RLS 우회)만 가능.
drop policy if exists companies_select_authenticated on public.companies;
create policy companies_select_authenticated on public.companies
  for select to authenticated
  using (true);

-- job_postings: 본인 행 전체(select/insert/update/delete).
drop policy if exists job_postings_all_own on public.job_postings;
create policy job_postings_all_own on public.job_postings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- company_analyses: 본인 읽기 + 본인 삽입. update/delete 정책 없음(불변 이력).
drop policy if exists company_analyses_select_own on public.company_analyses;
create policy company_analyses_select_own on public.company_analyses
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists company_analyses_insert_own on public.company_analyses;
create policy company_analyses_insert_own on public.company_analyses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
