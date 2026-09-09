-- 20260909071000_more_scrape_sources.sql
-- T42: 원티드·점핏·지행 스크래핑 출처 추가
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- 또는 supabase migration push 명령어 사용.

alter table public.job_postings drop constraint job_postings_source_check;

alter table public.job_postings add constraint job_postings_source_check
  check (source in ('manual', 'email', 'scrape_saramin', 'scrape_jobkorea', 'scrape_catch',
                    'scrape_wanted', 'scrape_jumpit', 'scrape_zighang'));
