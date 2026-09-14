alter table public.job_postings
  alter column deadline type timestamptz
  using case
    when deadline is null then null
    -- Existing date values become the end of that KST day, preserving prior deadline behavior.
    else (deadline::text || ' 23:59:59')::timestamp at time zone 'Asia/Seoul'
  end;
