# 대시보드 공고 목록 기능 4종 위임 (Codex)

- 2026-09-14 08:35
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 정본 계획: 이 문서 아래 태스크 breakdown이 정본. 더 자세한 배경/트레이드오프는
  `C:\Users\test\.claude\plans\bubbly-baking-dongarra.md`(plan 세션의 승인된 계획, 저장소 밖 경로)
  참고 가능하면 참고, 접근 안 되면 이 문서만으로 진행 가능하도록 아래에 필요한 내용을 다 옮겨뒀다.
- `.agents/implement.md`, `.agents/workflow.md`, `AGENTS.md`도 먼저 읽어라.

## 브랜치 (중요 — 리디자인과 다른 브랜치)

- **`main`(`a39901c`)에서 새 브랜치 `feat/job-listing-filters`를 딴다.** `feat/design-system` 위에
  올리지 않는다 — 그 브랜치가 이미 `filter-form.tsx`/`dashboard/index.tsx`/`add-job-posting/form.tsx`를
  리스타일했고 아직 병합 전(캘린더 작업 등 남음)이라, 계속 움직이는 브랜치 위에 쌓으면 나중에 리베이스가
  불안정해진다는 판단으로 사용자가 확정했다.
- 현재 작업 폴더는 `feat/design-system`에 체크아웃되어 있고 클린 상태다. `git checkout main && git pull`
  (필요시) `&& git checkout -b feat/job-listing-filters`로 시작해라. `feat/design-system`은 커밋된
  상태 그대로 안전하니 브랜치 전환 자체는 데이터 손실 없다.
- `main` 병합·push는 하지 마라. 다 끝나면 이 브랜치만 남겨라.

## 작업 순서 (반드시 이 순서, 병렬 금지 — 같은 파일을 여러 태스크가 순차로 건드림)

같은 Codex 세션에서 T1 → T7 순서로 진행하고 태스크마다 `[tag] 한글` 커밋. 각 태스크 후
`pnpm exec tsc --noEmit`(또는 `pnpm build`)로 타입체크.

**중요**: T1·T2(마이그레이션 파일)를 작성한 뒤에는 커밋만 하고 **한 번 멈춰라.** 마이그레이션은
Supabase에 사용자가 직접 적용해야 하고, 그 전까지는 T3~T7의 실제 DB 동작을 검증할 수 없다.
`artifacts/handover/<ts>-codex-job-listing-migrations-done.md`로 "마이그레이션 파일 작성 완료,
사용자 적용 대기" 보고를 남기고, 이어서 T3~T7을 계속 진행해도 된다(코드는 미리 짜둘 수 있음, 다만
실제 DB 검증은 사용자가 마이그레이션 적용한 뒤에나 가능하다는 점을 완료 보고에 명시해라).

### T1. `deadline` 컬럼 `date` → `timestamptz` 마이그레이션

새 파일 `supabase/migrations/<타임스탬프>_job_postings_deadline_timestamptz.sql`:

```sql
alter table public.job_postings
  alter column deadline type timestamptz
  using case
    when deadline is null then null
    -- 기존 date 값은 "그 날짜 23:59:59 KST"로 채운다 (마감 판정이 기존과 달라지지 않도록).
    else (deadline::text || ' 23:59:59')::timestamp at time zone 'Asia/Seoul'
  end;
```

새 파일 `server/job-postings/kst-deadline.ts`:

```ts
// KST(Asia/Seoul)는 서머타임 없는 고정 UTC+9이므로 라이브러리 없이 계산 가능.
export function endOfDayKstToIso(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, 14, 59, 59); // 23:59:59 KST = 14:59:59 UTC, 같은 날짜
  return new Date(utcMs).toISOString();
}
```

`server/supabase/types.ts`/`src/entities/job-posting/model.ts`의 `deadline: string | null` 타입은
그대로 둔다 — 값의 포맷만 date-only(`"2026-10-07"`)에서 ISO 타임스탬프로 바뀐다.

### T2. `career_level` 컬럼 추가 + 타입 단일 소스화

새 파일 `supabase/migrations/<T1보다 뒤 타임스탬프>_job_postings_career_level.sql`:

```sql
alter table public.job_postings add column career_level text;
alter table public.job_postings add constraint job_postings_career_level_check
  check (career_level is null or career_level in ('신입', '경력', '신입·경력', '경력무관'));
```

nullable(추출 실패 시 null = 필터에서 "전체" 취급).

**기술부채 반복 방지**: `EmploymentType`이 `src/entities/job-posting/model.ts` /
`server/job-postings/types.ts` / `server/job-postings/parse-url.ts` 3곳에 중복 정의된 기존 문제를
`CareerLevel`에서 반복하지 마라.

- 단일 소스: `server/job-postings/types.ts`에 `CareerLevel`/`CAREER_LEVELS` 정의.
- `src/entities/job-posting/model.ts`는 재수출만:
  `export { CAREER_LEVELS, type CareerLevel } from "@server/job-postings/types";`
- `JobPosting`에 `careerLevel: CareerLevel | null` 추가, `api.ts`의 `mapRow()`에 매핑 추가.
- `server/supabase/types.ts`의 `job_postings.Row/Insert/Update`에 `career_level: string | null` 추가
  (기존 `employment_type: string` 패턴처럼 넓게 두고 도메인 레이어에서 좁힘).

### T3. 마감일 시각 채우기 반영 (스크래퍼 + 수동입력) — depends on T1

- `server/scraping/saramin/parser.ts`의 `parseDeadline()`은 수정 불필요(그대로 date-only 반환).
- `server/job-postings/persist.ts`: deadline 매핑을 `posted_at`용 `parseDate`와 분리해, date-only
  문자열이면 `endOfDayKstToIso()` 적용, 이미 시각 포함 ISO면 그대로 사용.
- `src/entities/job-posting/api.ts`의 `insertJobPosting()`:
  `deadline: input.deadline ? endOfDayKstToIso(input.deadline) : null`.
- **스코프 제외**: 수동 등록 폼에 시각 입력 필드(`type="time"`) 추가는 이번에 하지 않는다 — 항상
  "그날 23:59:59 KST" 자동 채움.

### T4. `career_level` 자동 추출 + 연동 + 백필 — depends on T2

새 파일 `server/job-postings/career-level.ts`:

```ts
import { type CareerLevel } from "./types";

export function extractCareerLevel(text: string): CareerLevel | null {
  const t = text.replace(/\s+/g, "");
  if (/경력무관/.test(t)) return "경력무관";
  if (/신입[·,/및]?경력|경력[·,/및]?신입/.test(t)) return "신입·경력";
  if (/신입/.test(t)) return "신입";
  if (/경력\s*\d+\s*[년~-]|경력직|\d+\s*년\s*이상/.test(t)) return "경력";
  return null;
}
```

이 정규식은 출발점 — 실제 DB의 `role`/`raw_text` 샘플을 몇십 건 보고(`server/jobs/audit-postings.ts`
같은 기존 스크립트로 조회하거나 Supabase에서 직접) 다듬어라. 유닛테스트 러너가 없으므로(vitest/jest
없음) 기존 `server/jobs/verify-*.ts` 컨벤션대로 `server/jobs/verify-career-level.ts`를 만들어 샘플
텍스트 결과를 콘솔로 찍어 육안 검증해라.

**연동**: `persist.ts`의 배치 매핑(스크래퍼 공통 경로)과 `insertJobPosting()`(수동입력) 양쪽에서
`extractCareerLevel(role + " " + rawText)` 호출.

**백필**: 새 파일 `server/jobs/backfill-career-level.ts` — 기존 `server/jobs/dedupe-postings.ts`와
동일한 골격(dry-run 기본, `--apply` 플래그, `.range()` 페이지네이션 청크 처리). `career_level is null`인
행을 읽어 추출 적용 후 결과가 null 아닌 것만 update. dry-run 시 분류 분포 + 샘플 20건 콘솔 출력.
**실행(dry-run이든 apply든)은 사용자가 직접** — 코드만 짜두고 실행하지 마라.

### T5. `listJobPostings` 쿼리 개편 (`src/entities/job-posting/api.ts`) — depends on T1, T2

`cursor`/`formatCursor`/`parseCursor` 전체 삭제. offset 기반으로 교체:

```ts
export type ListJobPostingsOptions = {
  q?: string;
  employmentType?: EmploymentType;
  careerLevel?: CareerLevel;   // 신규
  source?: string;
  showClosed?: boolean;        // 구 onlyOpen 대체(의미 반전)
  onlyClosed?: boolean;        // 신규
  page?: number;               // cursor 대체
  limit?: number;              // 기본값 20 → 10
};

export type ListJobPostingsResult = {
  rows: JobPosting[];
  total: number;
  page: number;
  totalPages: number;   // nextCursor 대체
};
```

```ts
const limit = opts.limit ?? 10;
const page = Math.max(1, Math.floor(opts.page ?? 1));
const from = (page - 1) * limit;
const to = from + limit - 1;
const now = new Date().toISOString();

let query = supabase.from("job_postings").select("*", { count: "exact" })
  .order("created_at", { ascending: false }).order("id", { ascending: false })
  .range(from, to);

// q / employmentType / source / careerLevel: 기존 employmentType과 동일한
// `if (opts.x) { query = query.eq(...) }` 패턴 재사용.

// 마감 필터: onlyClosed가 showClosed보다 우선(더 구체적인 요청)
if (opts.onlyClosed) {
  query = query.lt("deadline", now);       // NULL 비교는 자동 제외 → 상시 공고 제외됨
} else if (!opts.showClosed) {
  query = query.or(`deadline.is.null,deadline.gte.${now}`);  // 기본: 진행중만
}
// showClosed=true && onlyClosed=false → 조건 없음(전체 표시)
```

`total`/`totalPages`는 `count`로 계산. **엣지 케이스**: 필터 변경으로 `page`가 `totalPages`를 넘으면
`.range()`는 빈 배열을 반환(에러 아님) — "0건 + 정상 페이지네이션 컨트롤"로 충분, 자동 리다이렉트는
안 만든다.

### T6. D-day 판정 유틸 — 신설 `src/entities/job-posting/d-day.ts` — depends on T1

```ts
export type DdayBadge =
  | { kind: "always"; label: "상시" }
  | { kind: "closed"; label: "마감" }
  | { kind: "dday"; label: `D-${number}` }
  | { kind: "hours"; label: `${number}시간 전` };

export function getDdayBadge(deadlineIso: string | null, now: Date = new Date()): DdayBadge {
  if (!deadlineIso) return { kind: "always", label: "상시" };
  const deadline = new Date(deadlineIso);
  if (deadline.getTime() <= now.getTime()) return { kind: "closed", label: "마감" };

  const nowDay = toKstCalendarDay(now);
  const deadlineDay = toKstCalendarDay(deadline);
  const dayDiff = diffCalendarDays(deadlineDay, nowDay);

  if (dayDiff >= 1) return { kind: "dday", label: `D-${dayDiff}` };

  // 오늘(KST) 마감, 아직 안 지남 → 남은 시간(올림). 사용자가 예시로 명시한 문구
  // "[N시간 전]" 그대로 구현 — 의미는 "마감까지 남은 시간".
  const hoursLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / 3_600_000));
  return { kind: "hours", label: `${hoursLeft}시간 전` };
}

function toKstCalendarDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date); // "YYYY-MM-DD"
}

function diffCalendarDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000);
}
```

`[마감]`(`kind: "closed"`)은 사용자가 명시적으로 확인해서 포함하기로 한 것이다 — 마감 필터 확장으로
마감된 공고가 목록에 노출될 수 있게 됐으니 배지 체계가 완결되도록.

### T7. 대시보드 뷰 / 필터폼 / 페이지네이션 UI — depends on T4, T5, T6

**`app/(app)/dashboard/page.tsx`**: `searchParams`에서 `cursor`/`onlyOpen` 제거,
`page`/`showClosed`/`onlyClosed`/`careerLevel` 추가.

**`src/views/dashboard/index.tsx`**:
- `normalizeFilters()`에 `page`(NaN/1미만이면 1로 클램프), `careerLevel`(화이트리스트 검증,
  `employmentType`과 동일 패턴), `showClosed`/`onlyClosed`(불리언) 반영.
- `listJobPostings` 호출: `limit: 10`, `page: filters.page`, `cursor` 제거.
- `buildNextQuery` 삭제 → `buildPageQuery(filters, page)` 신설(각 필터 truthy일 때만 쿼리에 포함,
  `page`는 1이면 URL에서 생략).
- "더 보기" 버튼 → 숫자 페이지네이션 컴포넌트로 교체. 5개 윈도우 슬라이딩:
  ```ts
  function getPageWindow(current: number, total: number, size = 5): number[] {
    let start = Math.max(1, current - Math.floor(size / 2));
    const end = Math.min(total, start + size - 1);
    start = Math.max(1, end - size + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  ```
  이전/다음 버튼 포함, 기존 `Button` variant 재사용.
- `JobPostingListItem`: 제목(`<h3>{posting.role}</h3>`) 앞에 `getDdayBadge(posting.deadline)` 결과를
  기존 `<Tag>` 컴포넌트(`src/shared/ui/tag`, gray/blue/green/yellow/red variant 보유)로 표시. 배지
  variant 매핑 예: `closed→red`, `hours→yellow`, `dday→blue`, `always→gray`. 오른쪽의 기존
  `employmentType` 태그와 겹치지 않게 제목 왼쪽/같은 줄에 배치.

**`src/features/search-job-postings/ui/filter-form.tsx`**:
- 체크박스 "마감 전" → "마감된 공고도 표시"(`showClosed`)로 개명, 신규 체크박스 "마감된 공고만"
  (`onlyClosed`) 추가.
- career_level `<select>` 추가(`employmentType` select와 동일 구조, `CAREER_LEVELS.map(...)`, 기본
  옵션 "전체").
- `handleSubmit`에서 `page`는 절대 params에 넣지 않음 — 필터 변경 시 자동으로 1페이지로 리셋됨.

## URL 쿼리 파라미터 정리

| 파라미터 | 상태 | 비고 |
|---|---|---|
| `q`, `employmentType`, `source` | 유지 | 변경 없음 |
| `careerLevel` | 신규 | 화이트리스트 검증 |
| `onlyOpen` | 제거 | `showClosed`/`onlyClosed`로 대체 |
| `showClosed` | 신규(구 onlyOpen 반전) | 기본 없음=진행중만, `"1"`=전체 |
| `onlyClosed` | 신규 | `"1"`=마감만, showClosed보다 우선 |
| `cursor` | 제거 | `page`로 대체 |
| `page` | 신규 | 1-based, `1`이면 URL 생략 |

## 완료 시 보고

`artifacts/handover/<ts>-codex-job-listing-filters-done.md`: 변경 파일, T##별 완료 여부, tsc/lint
결과, 커밋 해시들. 마이그레이션 2건은 "파일 작성만 완료, 실행은 사용자 대기"임을 명시. 아래 검증
체크리스트 중 코드 리뷰만으로 확인 가능한 항목(예: NULL 비교 로직, 우선순위 로직)은 짚어주고, 실제 DB
필요한 항목은 "사용자 확인 필요"로 남겨라.

## 검증 체크리스트 (사용자/qa 몫이지만 done 문서에 상태 남길 것)

1. 마감 필터 3상태(기본/전체/마감만) + 둘 다 체크 시 `onlyClosed` 우선 확인.
2. 상시 공고(`deadline is null`)가 `onlyClosed=1`일 때 절대 안 섞이는지.
3. 페이지네이션 이동 시 다른 필터 URL 유지, 필터 재제출 시 페이지 1로 리셋.
4. KST 시각 처리: 마이그레이션 후 기존 `deadline='2026-10-07'` 행이 `2026-10-07T14:59:59Z`로 바뀌었는지.
5. D-day 배지 4종(상시/마감/오늘 마감 시간단위/D-N) 실제 데이터로 육안 확인.
6. career_level 자동 추출 정확도(backfill dry-run 분포·샘플 검토).
7. 회귀: `src/widgets/saved-calendar/lib/to-events.ts`(feat/design-system 브랜치)가
   `posting.deadline`을 `new Date(value)`로 파싱하는 부분 — 두 브랜치 병합 시점에 재확인.
8. 매 태스크 후 `pnpm build` 통과.
