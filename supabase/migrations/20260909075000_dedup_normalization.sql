-- 20260909075000_dedup_normalization.sql
-- T46: 크로스-사이트 중복 제거용 generated 컬럼 정규화 강화
--
-- 주의:
--   * generated 컬럼 재계산으로 기존 행 사이에 새 중복군이 생길 수 있다.
--   * 이 마이그레이션은 제약을 다시 추가하기 전에 같은 dedup key 중 가장 오래된 행만 남기고 삭제한다.
--   * 실행 전 점검:
--       pnpm exec tsx --env-file=.env.local server/jobs/dedupe-postings.ts
--   * 직접 확인 후 삭제하려면:
--       pnpm exec tsx --env-file=.env.local server/jobs/dedupe-postings.ts --delete

alter table public.job_postings drop constraint if exists job_postings_dedup;

alter table public.job_postings drop column company_key;
alter table public.job_postings drop column role_norm;

alter table public.job_postings add column company_key text generated always as (
  regexp_replace(
    lower(coalesce(company_name_raw, '')),
    '주식회사|㈜|\(주\)|\(유\)|유한회사|\binc\.?|\bcorp\.?|\bco\.?|\bltd\.?|\bllc|\s',
    '',
    'g'
  )
) stored;

alter table public.job_postings add column role_norm text generated always as (
  btrim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(coalesce(role, '')),
          '\[[^]]*\]|\([^)]*\)',
          '',
          'g'
        ),
        '\s*(채용|모집|공고)\s*$',
        '',
        'g'
      ),
      '\s+',
      ' ',
      'g'
    )
  )
) stored;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, company_key, role_norm, employment_type, posted_at
      order by created_at asc, id asc
    ) as rn
  from public.job_postings
)
delete from public.job_postings as jp
using ranked
where jp.id = ranked.id
  and ranked.rn > 1;

alter table public.job_postings add constraint job_postings_dedup
  unique nulls not distinct (user_id, company_key, role_norm, employment_type, posted_at);
