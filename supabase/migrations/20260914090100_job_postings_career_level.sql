alter table public.job_postings add column career_level text;

alter table public.job_postings add constraint job_postings_career_level_check
  check (career_level is null or career_level in ('신입', '경력', '신입·경력', '경력무관'));
