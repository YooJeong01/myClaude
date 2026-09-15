# 공고 목록 필터 code-review should-fix 반영 위임 (Codex)

- 2026-09-14 09:15
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 브랜치: 같은 브랜치 `feat/job-listing-filters`에 이어서 커밋. 새 브랜치 안 만듦.
- 배경: `main...feat/job-listing-filters` code-review 완료, blocker 0 / should-fix 4건. 사용자와
  대화로 4건 전부 처리 방향 확정함(아래).

## 처리 방향 (사용자 확정)

### 1. D-day "N시간 전" 문구 — **변경 안 함**

리뷰어가 "N시간 전"이 국어상 "지났다"는 뜻으로 읽혀 어색하다고 지적했지만, 이건 원래 계획 단계에서
사용자가 예시로 명시한 문구를 그대로 구현한 것이고, 사용자가 재확인 후 **그대로 두기로 확정**했다.
`src/entities/job-posting/d-day.ts`의 `hours` 라벨 텍스트는 손대지 마라.

### 2. D-day 판정 기준을 "달력 날짜 차이"에서 "실제 남은 시간(ms)"로 변경 — 수정

현재 버그: `getDdayBadge`가 KST 달력 날짜 차이(`dayDiff`)로 시간단위/D-N을 나누다 보니, 자정을
사이에 둔 두 시점(예: 23:59:59 vs 00:00:02, 실제로는 3초 차이)이 하나는 `D-1`(여유 있어 보임),
하나는 시간단위 긴급 표시로 정반대로 나온다.

**수정 방향**: 달력 날짜 대신 **실제 남은 밀리초**를 기준으로 24시간 이내면 시간 단위, 아니면
날짜 단위로 나눈다.

`src/entities/job-posting/d-day.ts`를 다음 로직으로 교체:

```ts
export type DdayBadge =
  | { kind: "always"; label: "상시" }
  | { kind: "closed"; label: "마감" }
  | { kind: "dday"; label: `D-${number}` }
  | { kind: "hours"; label: `${number}시간 전` };

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export function getDdayBadge(deadlineIso: string | null, now: Date = new Date()): DdayBadge {
  if (!deadlineIso) return { kind: "always", label: "상시" };

  const deadline = new Date(deadlineIso);
  const msLeft = deadline.getTime() - now.getTime();
  if (msLeft <= 0) return { kind: "closed", label: "마감" };

  if (msLeft <= DAY_MS) {
    const hoursLeft = Math.max(1, Math.ceil(msLeft / HOUR_MS));
    // 사용자가 예시로 명시한 문구 그대로 유지 — 의미는 "마감까지 남은 시간".
    return { kind: "hours", label: `${hoursLeft}시간 전` };
  }

  const daysLeft = Math.floor(msLeft / DAY_MS);
  return { kind: "dday", label: `D-${daysLeft}` };
}
```

기존에 있던 `toKstCalendarDay`/`diffCalendarDays` 헬퍼는 더 이상 쓰이지 않으면 지워라(다른 곳에서
참조하는지 확인 후). KST 관련 처리가 필요 없어졌다 — 실제 경과시간(ms) 비교라 타임존 변환 자체가
불필요하다.

### 3. 페이지네이션 이전/다음 버튼 disabled 무효 — 수정

`src/views/dashboard/index.tsx`(대략 306번째 줄)의 이전/다음 버튼이 `<Button asChild disabled={...}>`
로 `<Link>`(→ `<a>`)를 감싸고 있는데, HTML anchor는 `disabled` 속성을 무시하고 `:disabled` CSS
의사클래스도 `<a>`엔 매치되지 않아서, 비활성 상태여야 할 때도 시각적으로 멀쩡히 클릭 가능해 보인다.

**수정 방향**: 비활성 상태일 땐 `<Link>`를 아예 렌더링하지 말고 진짜 `<button disabled>`(또는
기존 `Button` 컴포넌트를 `asChild` 없이 직접 disabled로)를 렌더링해라. 활성 상태일 때만
`<Button asChild><Link href={...}>...</Link></Button>` 패턴을 쓴다. 예:

```tsx
{page <= 1 ? (
  <Button variant="outline" disabled>이전</Button>
) : (
  <Button asChild variant="outline">
    <Link href={{ pathname: "/dashboard", query: buildPageQuery(filters, page - 1) }}>이전</Link>
  </Button>
)}
```
다음 버튼도 동일 패턴(`page >= totalPages`).

### 4. "마감된 공고만"을 체크박스 → 필터 폼 셀렉트박스로 변경 — 수정

사용자 의도 확인: "마감된 공고도 표시"는 지금처럼 체크박스로 유지. "마감된 공고만"은 체크박스가
아니라 검색 필터 폼(직무·경력·고용형태 select들 있는 영역)에 **셀렉트박스**로 옮긴다.

`src/features/search-job-postings/ui/filter-form.tsx`:
- 기존 "마감된 공고만" `<input type="checkbox" name="onlyClosed">` 제거.
- 같은 필터 폼 영역(employmentType/careerLevel select들 옆)에 새 `<select name="onlyClosed">` 추가:
  ```tsx
  <select name="onlyClosed" defaultValue={defaultValues.onlyClosed ? "1" : ""} ...>
    <option value="">전체</option>
    <option value="1">마감된 공고만</option>
  </select>
  ```
  라벨은 "마감 상태" 정도로(다른 select 라벨 컨벤션 따라).
- `handleSubmit`에서 기존 체크박스 전용 처리(`formData.get("onlyClosed") === "on"`) 대신, 다른
  select들과 동일한 `setParam(params, "onlyClosed", String(formData.get("onlyClosed") ?? ""));`
  패턴으로 교체 — URL 쿼리 파라미터 계약(`onlyClosed=1`/부재)은 그대로 유지되므로 서버 쪽
  (`normalizeFilters`, `listJobPostings`)은 손댈 필요 없다.
- "마감된 공고도 표시"(`showClosed`) 체크박스는 그대로 둔다.
- 우선순위 로직(`onlyClosed`가 `showClosed`보다 우선)은 기존 그대로 유지 — 이미 올바르게 구현돼
  있으니 `api.ts`는 안 건드려도 된다.

## 완료 시 보고

같은 파일에 이어쓰기: `artifacts/handover/2026-09-14-08-47-codex-job-listing-filters-progress.md`
스타일로 태스크별 커밋. 끝나면 `artifacts/handover/<ts>-codex-job-listing-filters-review-fix-done.md`
작성 — 수정 파일, 커밋 해시, `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm build` 결과.

## 지킬 것

- `main` 병합·push 안 함.
- 마이그레이션 파일은 이미 작성 완료 상태 — 이번 라운드에서 안 건드림.
- 1번(문구)은 정말 손대지 마라 — 사용자가 명시적으로 그대로 두기로 확정한 부분이다.
