# Day2 마무리 작업 — Codex 위임 (2026-09-06 18:30)

## ✅ 완료 상태

### 0단계: Supabase 마이그레이션
- **마이그레이션**: `20260905130000_job_postings_scrape_sources.sql` **성공 실행**
- job_postings source 체크 제약 업데이트 완료
  - 이전: `'manual', 'email'`만 허용
  - 현재: `'manual', 'email', 'scrape_saramin', 'scrape_jobkorea', 'scrape_catch'` 허용
- **원인 파악**: 이전 오류("email 컬럼 없음")는 SQL Editor 같은 탭에 다른 SQL이 함께 실행된 것 (우리 마이그레이션 파일은 profiles 테이블을 건드리지 않음)

---

## 📋 Codex 위임 범위 (1~4단계)

### 1단계: 스크래퍼 재검증 (~15분)
**명령어:**
```bash
npm exec tsx -- --env-file=.env.local server/jobs/scrape-saramin.ts
npm exec tsx -- --env-file=.env.local server/jobs/scrape-jobkorea.ts
npm exec tsx -- --env-file=.env.local server/jobs/scrape-catch.ts
```

**검증:**
- 각 스크래퍼 로그에서 수집 건수 확인
- Supabase Table Editor(`job_postings` 테이블)에서:
  - 사람인: 240건 insert 확인
  - 잡코리아: 36건 insert 확인
  - 캐치: 0건이면 2단계로 진행

---

### 2단계: 캐치 스크래퍼 0건 원인 조사 (필요 시, ~15분)
**대상 파일:**
- `server/scraping/catch/client.ts`
- `server/scraping/catch/config.ts`
- `server/scraping/catch/parser.ts` (있으면)

**조사 항목:**
- Playwright 렌더링 후 DOM에 결과 리스트가 실제로 있는지
- `/NCS/RecruitSearch` 응답 HTML 구조가 파서 셀렉터와 일치하는지
- 원인 파악되면 셀렉터/추출 로직 수정 + 재실행

---

### 3단계: GHA 워크플로 검증 (T18, ~20분)
**대상:** `.github/workflows/scrape-postings.yml`

**체크리스트:**
1. GitHub repo → Settings → Secrets에 다음 등록 확인:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SCRAPE_OWNER_USER_ID`
   - `SCRAPE_SEARCH_KEYWORDS`

2. `gh workflow run scrape-postings.yml` 수동 실행 (또는 GitHub UI의 workflow_dispatch)

3. `gh run watch` 로 3개 job(saramin/jobkorea/catch) 성공 여부 확인
   - 실패 시 로그로 원인 파악

4. Supabase에서 새 행이 실제로 쌓이는지 최종 확인

---

### 4단계: 네이버 검색 API 401 확인 (~10분)
**대상:** `server/jobs/verify-naver.ts`

**체크리스트:**
1. `.env.local`의 `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` 값 확인
   - 비어있거나 오탈자 없는지

2. `npm exec tsx -- --env-file=.env.local server/jobs/verify-naver.ts` 실행
   - 401 오류 여전하면 정확한 메시지 기록

3. 해결 방법:
   - 401 = 인증 오류 (API 키 유효성 재확인 필요, **사용자 담당**)
   - 다른 오류 = 코드 수정 필요

---

## 📝 Codex 완료 시 보고 항목

1. **각 스크래퍼 수집/저장 결과** (건수, 시간)
2. **캐치 0건 여부 및 원인** (해결됐으면 수정 내용)
3. **GHA 3개 job 실행 결과** (성공/실패 + 로그)
4. **네이버 API 401 원인** (해결됐으면 내용, 아니면 사용자 액션 명시)
5. **생긴 모든 커밋 내역** (수정 사항 있으면)

---

## 🎯 예상 완료 시간

- 1단계: 15분
- 2단계: 0~15분 (캐치 성공하면 스킵)
- 3단계: 20분
- 4단계: 10분
- **총 ~45~60분**

---

## ⚠️ 주의사항

- 모든 스크래퍼는 `.env.local` 환경변수 필요 (없으면 에러)
- GHA Secrets가 등록 안 되면 3단계 실패 → 사용자에게 알림
- 네이버 API 401은 사용자의 Naver Developers 계정 확인 필요할 수 있음 (우선순위 낮음, 확인만 하고 해결 못하면 "사용자 액션 필요"로 기록)
