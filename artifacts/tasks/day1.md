# Day 1 태스크 — 프로젝트 스캐폴딩 + 기업분석 API 기반 연동

## 의존성 순서

**T1 → (T2 ∥ T4) → T3 → (T5 ∥ T6) → T7**

- T2와 T4는 T1 후 병렬 실행 가능
- T5와 T6은 T3 후 병렬 실행 가능
- T7은 이전 태스크들의 결과물 필요

## T1. 프로젝트 스캐폴딩 [Codex 위임 완료]

### 1-1. Next.js 프로젝트 초기화
- [완료] `create-next-app` 실행 (TypeScript, App Router, `src/` 디렉토리, Tailwind CSS 활성화)

### 1-2. 패키지 매니저 전환
- [완료] `corepack enable` 로 pnpm 활성화 (workspace 내부 `.corepack` 경로)
- [완료] `pnpm install` 실행해 `pnpm-lock.yaml` 생성 (pnpm 9.15.4)

### 1-3. 프로젝트 폴더 구조 구성
- [완료] 루트 `app/` 폴더 생성 (Next App Router 사용)
- [완료] `src/` 하위 FSD 레이어 폴더 생성: `app/`, `views/`, `widgets/`, `features/`, `entities/`, `shared/`
- [완료] 루트 `server/` 폴더 생성 (런타임 무관 도메인 레이어)
- [완료] 기존 파일 정리: `src/app/index.tsx` 삭제, `src/pages/` 백업

### 1-4. 기존 컴포넌트 이동
- [완료] `src/pages/hero` → `src/views/hero` 이동
- [완료] `src/pages/dashboard` → `src/views/dashboard` 이동

### 1-5. ESLint + FSD 경계 린트 설정
- [완료] `steiger` + `@feature-sliced/steiger-plugin` 설치 및 설정
- [완료] `server/` 에서 `next/*` import 금지 규칙(`no-restricted-imports`) 추가 (eslint.config.mjs)
- [완료] Prettier 설정 완료 (prettier.config.mjs)
- [완료] `pnpm lint` 통과 (ESLint + Steiger FSD 검사)

### 1-6. shadcn/ui 초기화
- [완료] `components.json` 설정 완료 (네트워크 제약으로 수동 구성)
- [완료] 컴포넌트 라이브러리 기본 설정 완료 (Button 컴포넌트 포함)

### 1-7. 환경 변수 파일 작성
- [완료] `.env.example` 작성:
  - [완료] `DART_API_KEY` (DART Open API)
  - [완료] `NEXT_PUBLIC_SUPABASE_URL` (Supabase 프로젝트 URL)
  - [완료] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (익명 공개 키)
  - [완료] `SUPABASE_SERVICE_ROLE_KEY` (서버 전용 시크릿)
  - [완료] `CRON_SECRET` (GH Actions 인증)

### 1-8. tsx 설치
- [완료] `tsx` devDependency 설치 (4.19.2, server/jobs 로컬 테스트용)

### 1-9. 스모크 테스트
- [완료] `pnpm lint` 실행 → 린트 규칙 정상 작동 확인
- [진행중] `pnpm dev` 실행 → localhost:3000 응답 대기 (프로세스 완료, HTTP 확인 필요)

---

## T2. Supabase 프로젝트 생성 + 연결 [완료 2026-08-31]

### 2-1. Supabase 계정 & 프로젝트 생성 (사용자 담당)
- [완료] Supabase 계정 생성 (supabase.com)
- [완료] 새 프로젝트 생성, 리전 선택
- [완료] 프로젝트 URL, anon 키, service-role 키 확보

### 2-2. Supabase SSR 클라이언트 설치 & 구성
- [완료] `@supabase/ssr` 설치
- [완료] `src/shared/api/supabase/` 폴더 생성
  - [완료] `client.ts` — 브라우저 클라이언트 (anon 키, 쿠키 인식 아님)
  - [완료] `server.ts` — 서버 컴포넌트/API Route용 쿠키 기반 클라이언트 (SSR)
  - [완료] `middleware.ts` — 세션 리프레시 헬퍼 (@supabase/ssr 표준 패턴)

### 2-3. 서버 전용 Supabase 관리자 클라이언트
- [완료] `server/supabase/` 폴더 생성
- [완료] `admin.ts` — service-role 키 사용 (RLS 우회, GH Actions 잡용)

### 2-4. 환경 변수 배선
- [완료] `.env.local` 작성 (개발용):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - 참고: `.env.local`은 gitignore 대상이라 커밋되지 않음 — 다른 환경/새 클론에서 이어서 작업할 땐 매번 재작성 필요 (현재 이 워킹 디렉터리에도 없음)

### 2-5. 스모크 테스트
- [완료] `src/shared/api/supabase/server.ts` 로 간단한 select 시도 (예: 존재하는 테이블)
- [완료] 요청 성공 → 연결 정상 확인 (`server/jobs/verify-schema.ts`)

---

## T3. DB 스키마 v0 + RLS 초안 [완료 2026-08-31]

### 3-1. 마이그레이션 파일 작성
- [완료] `supabase/migrations/` 폴더 생성
- [완료] 초 마이그레이션 SQL 파일 작성 (`20260830155347_init.sql`):
  - `profiles` 테이블 (user_id PK, 사용자 메타)
  - `job_postings` 테이블 (user_id, 공고 원본 링크/텍스트)
  - `companies` 테이블 (기업명, 공개정보)
  - `company_analyses` 테이블 (user_id, company_id, 분석 결과, created_at — 이력 누적)

### 3-2. 신선도 표시 필드
- [완료] `company_analyses.created_at` — 분석 시각 기록
- [완료] 프론트에서 "며칠 지났다" 표시용으로 사용

### 3-3. RLS 정책 초안
- [완료] 모든 테이블에 `auth.uid()` 기반 행 필터 추가
  - `profiles`: 본인만 read/write
  - `job_postings`: 본인만 read/write
  - `company_analyses`: 본인 분석만 read, write는 서버에서만

### 3-4. Supabase 대시보드에서 실행
- [완료] 마이그레이션 파일 Supabase SQL Editor에 복사·붙여넣기
- [완료] 실행 확인 → 테이블·정책 생성 완료 (`server/jobs/verify-schema.ts` 통과)

---

## T4. DART API 클라이언트 모듈 [완료 2026-08-31]

### 4-1. DART 클라이언트 로직 작성
- [완료] `server/dart/` 폴더 생성
- [완료] `types.ts` — DART API 응답 타입 정의
- [완료] `corp-codes.ts` — corp_code 조회 (전체 목록 다운로드/간단 캐시)
- [완료] `client.ts` — 재무제표, 공시 정보 엔드포인트 래퍼
  - 매출, 순이익, 자산 등 기본 항목만 먼저
  - 타입 안전 반환
- [완료] (추가 발견) `dart_corp_codes` 테이블 + 동기화 잡(`server/jobs/sync-dart-corp-codes.ts`) — 회사명 검색 API가 없어 corpCode.xml 전체 적재 필요했음
- [완료] (버그 수정) corp_code 파싱 시 앞자리 0 유실 수정

### 4-2. 환경 변수 추가
- [완료] `.env.example` 에 `DART_API_KEY` 추가

### 4-3. Route Handler 작성
- [완료] `app/api/company/dart/route.ts` 생성
  - 얇은 어댑터: `GET /api/company/dart?corp=<기업명>`
  - `server/dart/` 모듈 호출
  - 결과 JSON 반환

### 4-4. 테스트
- [완료] Postman/curl: `curl "http://localhost:3000/api/company/dart?corp=삼성전자"`
- [완료] 재무 데이터 JSON 반환 확인 (`server/jobs/verify-dart.ts` 통과)
- [완료] `server/dart/` 에 `next/*` import 없음 확인 (lint 통과)

---

## T5. 수동 공고 입력 UI + 저장 [구현 완료 2026-09-05, Codex 위임]

### 5-1. 엔티티 정의
- [완료] `src/entities/job-posting/` 폴더 생성
- [완료] `model.ts` — JobPosting 타입, 유효성 검사
- [완료] `api.ts` — Supabase insert 호출

### 5-2. 피처 구성
- [완료] `src/features/add-job-posting/` 폴더 생성
- [완료] `ui/form.tsx` — 링크/텍스트 입력 폼 컴포넌트
- [완료] `lib/submit.ts` — 폼 제출 액션, `job_postings` insert
- [완료] 에러 처리, 로딩 상태

### 5-3. 대시보드 통합
- [완료] `src/views/dashboard/` 에 피처 import
- [완료] 폼 표시 + 저장된 공고 목록 표시
- [완료] 최소 스타일 (Tailwind 기본)

### 5-4. 테스트
- [ ] 링크/텍스트 입력 후 제출 → Supabase `job_postings` 행 생성 확인
- [ ] 대시보드 목록에 표시 확인
  - `.env.local`이 없어 이번 세션에서는 못 돌림 — 사용자가 로컬에 키 채운 뒤 직접 확인 예정

---

## T6. 기본 레이아웃 / 랜딩 골격 [구현 완료 2026-09-05, Codex 위임]

### 6-1. 라우트 그룹 생성
- [완료] `app/(marketing)/page.tsx` — 랜딩 페이지
- [완료] `app/(app)/dashboard/page.tsx` — 로그인 후 대시보드 라우트

### 6-2. 랜딩 페이지
- [완료] `src/views/hero/` 에서 기본 랜딩 컴포넌트 구성
- [완료] 프로젝트 설명, "로그인" CTA 버튼 (아직 동작 아님)

### 6-3. FSD app 레이어
- [완료] `src/app/` 폴더 생성 (FSD app 계층 = 글로벌 프로바이더)
- [완료] `providers.tsx` — Supabase/Theme/기타 프로바이더 중앙화
- [완료] `globals.css` — 전역 스타일 (Tailwind 기본)

### 6-4. 루트 레이아웃
- [완료] `app/layout.tsx` — RootLayout, `src/app/providers.tsx` 적용
- [완료] metadata 기본 설정

### 6-5. Auth 게이트 (mock)
- [완료] `middleware.ts` 생성 (Supabase SSR 표준 패턴)
  - 비로그인 사용자 → 비로그인 라우트만 접근 가능
  - 로그인 사용자 → 앱 라우트 접근 가능
  - **실제 로그인 구현은 아직 아님** (8~9일차)

### 6-6. 스모크 테스트
- [완료] `pnpm lint` 통과 확인 (ESLint + Steiger FSD 경계)
- [ ] `pnpm dev` → 랜딩 페이지 렌더 확인
- [ ] 대시보드 라우트 접근 (mock 게이트 통과/거절 확인)
  - `.env.local`이 없어 이번 세션에서는 못 돌림 — 사용자가 로컬에 키 채운 뒤 직접 확인 예정

---

## T7. Vercel 연결 [사용자]

### 7-1. Vercel 임포트
- [ ] Vercel 대시보드에서 GitHub 리포 연결
- [ ] `C:\myClaude` 레포 선택 및 임포트

### 7-2. 환경 변수 등록
- [ ] Vercel 프로젝트 Settings → Environment Variables
  - `DART_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CRON_SECRET`

### 7-3. 배포 테스트
- [ ] 프리뷰 배포 트리거 (main 브랜치 푸시 또는 수동 배포)
- [ ] 프리뷰 URL 접속 → 랜딩 페이지 로드 확인
- [ ] 콘솔 에러 없음 확인

### 7-4. 완료
- [ ] 프리뷰 URL 기록

---

## 2일차 이후로 미룬 작업

- 알림메일 수집 (Gmail IMAP 폴링 vs Gmail API) — 2일차 결정
- GitHub Actions 스케줄 워크플로 (`.github/workflows/collect.yml`) — 2일차
- 사람인·네이버 API 연동 — 승인/신청 후
- 인증 구현 (Google OAuth vs 매직링크) — 8~9일차
- DB 스키마 확정 — T3 초안에서 프론트 피드백 받아 발전

## 지켜야 할 규율

1. **`server/` 에 `next/*` import 금지** — ESLint 린트가 자동 차단
2. **Supabase Auth 중앙화** — `entities/session` + `requireUser()` 이음새로만 세션 추출
3. **FSD 경계 린트 강제** — 수동 관리는 반드시 침식됨
4. **쿠키/SSR 전용 설계** — 토큰 기반 클라이언트는 나중에 어댑터로 추가
