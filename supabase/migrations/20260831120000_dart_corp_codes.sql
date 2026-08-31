-- 20260831120000_dart_corp_codes.sql
-- T4: DART 고유번호(corp_code) 조회 테이블
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
--
-- 배경:
--   DART Open API 에는 "회사명으로 검색" 엔드포인트가 없다. 회사명 → corp_code(8자리)
--   매핑은 corpCode.xml(약 10만 개 기업) 다운로드가 유일한 경로다. 콜드스타트마다
--   재다운로드하지 않도록 이 테이블에 영속화하고, 동기화는 잡(server/jobs/sync-dart-corp-codes.ts,
--   추후 GitHub Actions cron)이 맡는다.
--
-- 접근:
--   순수 레퍼런스/인프라 데이터. RLS 를 켜고 정책은 두지 않는다 →
--   service-role(관리자 클라이언트)로만 읽고 쓴다. Route Handler 도 관리자 클라이언트로 조회.

create table if not exists public.dart_corp_codes (
  corp_code     text primary key,                    -- DART 고유번호 8자리
  corp_name     text not null,
  corp_eng_name text,
  stock_code    text,                                -- 상장 종목코드 6자리 (비상장 null)
  modify_date   date,                                -- DART 기준 최종 변경일
  synced_at     timestamptz not null default now()   -- 이 행을 마지막으로 적재한 시각
);

comment on table public.dart_corp_codes is 'DART corpCode.xml 전체 적재본. 회사명 → corp_code 조회용. 쓰기는 동기화 잡(service-role)만.';

create index if not exists dart_corp_codes_name_idx
  on public.dart_corp_codes (corp_name);
create index if not exists dart_corp_codes_name_lower_idx
  on public.dart_corp_codes (lower(corp_name));

alter table public.dart_corp_codes enable row level security;
-- 정책 없음: authenticated/anon 모두 접근 불가. service-role 만 RLS 우회.
