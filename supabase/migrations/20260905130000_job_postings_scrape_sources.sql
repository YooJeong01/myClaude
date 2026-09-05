-- 20260905130000_job_postings_scrape_sources.sql
-- T9: job_postings source 체크 제약 확장 (스크래핑 출처 추가)
--
-- Day2 에서 사람인·잡코리아·캐치를 직접 스크래핑하기로 변경.
-- 기존 'manual'/'email' 외에 사이트별 스크래핑 출처를 추가한다.
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- 또는 supabase migration push 명령어 사용.

alter table public.job_postings drop constraint job_postings_source_check;

alter table public.job_postings add constraint job_postings_source_check
  check (source in ('manual', 'email', 'scrape_saramin', 'scrape_jobkorea', 'scrape_catch'));
