# Day1 T5·T6 위임 — 공고 입력 UI + 레이아웃/랜딩 골격

- 2026-09-05 pm7:05

## 지금까지 상태

`artifacts/tasks/day1.md` 기준 T1~T4 완료(오늘 체크박스 갱신 완료):

- T1: 프로젝트 스캐폴딩 (Next.js + pnpm + FSD + ESLint/Steiger + shadcn/ui)
- T2: Supabase 프로젝트 생성 + SSR/관리자 클라이언트 연결
- T3: DB 스키마 v0(`profiles`/`companies`/`job_postings`/`company_analyses`) + RLS, 마이그레이션 `supabase/migrations/20260830155347_init.sql`
- T4: DART API 클라이언트 모듈 + `app/api/company/dart/route.ts` + `dart_corp_codes` 캐시 테이블/동기화 잡

의존성 순서(day1.md): `T1 → (T2∥T4) → T3 → (T5∥T6) → T7`. T3까지 끝났으므로 **T5와 T6은 서로 독립적으로 병렬 진행 가능.**

T7(Vercel 연결)은 사용자 담당이라 오늘 범위 아님.

## 오늘 목표 — T5 + T6

### T5. 수동 공고 입력 UI + 저장

원문(day1.md 그대로):

- **5-1. 엔티티 정의**
  - `src/entities/job-posting/` 폴더 생성
  - `model.ts` — JobPosting 타입, 유효성 검사
  - `api.ts` — Supabase insert 호출
- **5-2. 피처 구성**
  - `src/features/add-job-posting/` 폴더 생성
  - `ui/form.tsx` — 링크/텍스트 입력 폼 컴포넌트
  - `lib/submit.ts` — 폼 제출 액션, `job_postings` insert
  - 에러 처리, 로딩 상태
- **5-3. 대시보드 통합**
  - `src/views/dashboard/`에 피처 import
  - 폼 표시 + 저장된 공고 목록 표시 (shadcn/ui Table 또는 List)
  - 최소 스타일 (Tailwind 기본)
- **5-4. 테스트**
  - 링크/텍스트 입력 후 제출 → Supabase `job_postings` 행 생성 확인
  - 대시보드 목록에 표시 확인

참고 — `job_postings` 테이블 실제 컬럼(`supabase/migrations/20260830155347_init.sql`):
`user_id`, `company_id`(nullable), `company_name_raw`, `role`(필수), `employment_type`(체크 제약: 정규직/계약직/인턴/파견/프리랜서/기타, 기본값 기타), `posted_at`, `deadline`, `source`(체크 제약: manual/email, 수동 입력이므로 `'manual'` 고정), `url`, `raw_text`(url 또는 raw_text 둘 중 하나는 필수 — `job_postings_has_content` 제약), 중복 방지 unique 제약(`user_id, company_key, role_norm, employment_type, posted_at`). 폼/유효성 검사 설계 시 이 제약을 그대로 반영할 것.

### T6. 기본 레이아웃 / 랜딩 골격

원문(day1.md 그대로):

- **6-1. 라우트 그룹 생성**
  - `app/(marketing)/page.tsx` — 랜딩 페이지
  - `app/(app)/dashboard/page.tsx` — 로그인 후 대시보드 라우트
- **6-2. 랜딩 페이지**
  - `src/views/hero/`에서 기본 랜딩 컴포넌트 구성
  - 프로젝트 설명, "로그인" CTA 버튼 (아직 동작 아님)
- **6-3. FSD app 레이어**
  - `src/app/` 폴더 생성 (FSD app 계층 = 글로벌 프로바이더)
  - `providers.tsx` — Supabase/Theme/기타 프로바이더 중앙화
  - `globals.css` — 전역 스타일 (Tailwind 기본)
- **6-4. 루트 레이아웃**
  - `app/layout.tsx` — RootLayout, `src/app/providers.tsx` 적용
  - metadata 기본 설정
- **6-5. Auth 게이트 (mock)**
  - `middleware.ts` 생성 (Supabase SSR 표준 패턴)
  - 비로그인 사용자 → 비로그인 라우트만 접근 가능
  - 로그인 사용자 → 앱 라우트 접근 가능
  - **실제 로그인 구현은 아직 아님** (8~9일차)
- **6-6. 스모크 테스트**
  - `pnpm dev` → 랜딩 페이지 렌더 확인
  - 대시보드 라우트 접근 (mock 게이트 통과/거절 확인)

주의: T6은 `entities/session` + `requireUser()` 이음새를 처음 만들게 되는 지점이다(아래 "지켜야 할 규율" 참고). mock 게이트라도 이 이음새 형태로 설계할 것 — 나중에 실제 인증(8~9일차) 붙을 때 이 함수 내부만 바꾸면 되도록.

## 재사용할 기존 산출물 (새로 만들지 말 것)

- `src/shared/api/supabase/client.ts` — 브라우저 클라이언트
- `src/shared/api/supabase/server.ts` — 서버 컴포넌트/Route Handler용 쿠키 기반 클라이언트
- `src/shared/api/supabase/middleware.ts` — 세션 리프레시 헬퍼 (T6 미들웨어에서 그대로 사용)
- `server/supabase/admin.ts` — service-role 클라이언트 (T5에서는 쓸 필요 없음, RLS로 본인 행만 다루면 됨)
- `src/views/hero/index.tsx`, `src/views/dashboard/index.tsx` — 기존 스텁, 이어서 확장
- `src/shared/ui/button.tsx` — shadcn Button

## 지켜야 할 규율

1. `server/`에 `next/*` import 금지 — ESLint `no-restricted-imports` 룰이 자동 차단(위반 시 `pnpm lint` 실패)
2. Supabase Auth 접근은 중앙화 — `entities/session` + `requireUser()` 함수로만 세션 추출 (T6에서 처음 설계)
3. FSD 경계 린트 강제 — `pnpm lint`(ESLint + Steiger) 통과 필수
4. 쿠키/SSR 전용 설계 — 토큰 기반 클라이언트는 나중에 어댑터로 추가

## 로컬 환경 준비 (실행 전 필요)

`.env.local`은 gitignore 대상이라 커밋되지 않음 — 이 레포를 새로 열었다면 아래 값을 직접 채워 넣어야 `pnpm dev`/Supabase 연동 테스트가 됨:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DART_API_KEY=
```

## 검증

- `pnpm lint` 통과 (ESLint + FSD 경계)
- `pnpm dev` → 랜딩 페이지 렌더, 대시보드 라우트에서 mock 게이트 동작 확인
- 대시보드에서 공고 입력 폼 제출 → Supabase `job_postings`에 행 생성 확인, 목록에 즉시 반영 확인

## 완료 후

T5·T6 끝나면 `artifacts/tasks/day1.md`의 해당 체크박스를 `[완료]`로 갱신(사용자 확인 후 반영 — 임의로 먼저 하지 말 것). 그다음은 T7(Vercel 연결, 사용자 담당) 차례.
