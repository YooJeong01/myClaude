# E2E 스펙 갱신 + 768px 필터폼 그리드 버그 수정 위임 (Codex)

- 2026-09-14 18:00
- 위임자: claude (plan) / 실행자: codex (`codex exec --approve-for-me`, 백그라운드)
- 같은 브랜치 `feat/design-system`에 이어서 커밋. 새 브랜치 안 만듦.

## T1. 768px에서 필터폼 체크박스 라벨이 세로로 쪼개지는 버그 수정

배경: `artifacts/test-reports/redesign-visual-qa-round2.md` 참고. 768px 뷰포트에서
`src/features/search-job-postings/ui/filter-form.tsx`의 "마감된 공고도 표시" 체크박스 라벨이
글자 단위로 세로 줄바꿈되는 버그를 스크린샷으로 확인했다.

현재 그리드:
```ts
gridTemplateColumns: {
  base: "1fr",
  md: "minmax(0, 1fr) 10rem 10rem 10rem 10rem auto auto"
}
```
`md`(768px)에서 활성화되는 7열(검색어 + 고용형태 + 경력 + 출처 + 마감상태 4개 select, 체크박스,
버튼) dense grid가 768px 뷰포트 + 사이드바 폭까지 감안하면 공간이 부족해서, 체크박스 라벨이
들어가는 `auto` 트랙이 극단적으로 좁게 계산되는 것으로 추정된다.

**수정 방향(택 1, 판단은 Codex 재량)**:
- (a) 7열 dense grid를 `md`가 아니라 `lg`(1024px)에서 활성화하고, `md` 구간(768~1023px)은
  중간 단계로 2~3열 정도로 나눠 랩되게 한다(예: `md: "repeat(2, minmax(0, 1fr))"`,
  `lg: "minmax(0, 1fr) 10rem 10rem 10rem 10rem auto auto"`).
- (b) 체크박스 라벨에 `whiteSpace: "nowrap"`을 주고, 그리드 트랙 자체를
  `minmax(max-content, auto)`로 바꿔서 내용보다 좁아지지 않게 강제한다.
- 실제 브라우저(가능하면)로 360/768/1280 세 폭 다 확인해서 어느 쪽도 깨지지 않는 걸 확인해라.
  이번엔 브라우저 확인이 되면 꼭 해보고, 안 되면 done 문서에 명시.

## T2. E2E 스펙 갱신 — "공고 검색·페이지네이션" 시나리오

`e2e/day5-report.spec.ts`의 시나리오 7("공고 검색·페이지네이션", 약 214번째 줄)이 옛
"더 보기"(cursor 기반) UI를 기준으로 짜여 있어서, 지금의 숫자 페이지네이션 UI에서는
`더 보기` 링크가 아예 없으니 `hadMore` 분기가 항상 `false`가 되고 실질적으로 아무것도 검증 못한 채
"통과" 처리된다(vacuous pass). 새 UI에 맞게 다시 짜라:

```ts
test("7. 공고 검색 + 페이지네이션", async ({ page }) => {
  await runScenario(
    "공고 검색·페이지네이션",
    "대시보드 공고 목록이 검색어로 필터되고 숫자 페이지네이션이 동작한다.",
    "로그인 세션과 11건 이상의 수집된 공고가 필요하다(1페이지=10건이라 2페이지 존재 확인용).",
    "검색어 입력 → URL 갱신 → 결과 필터 확인, 2페이지 링크 클릭 → page 파라미터 확인 → 이전 버튼이 1페이지에서 실제 비활성(진짜 button)인지 확인",
    "검색 시 URL 에 q 파라미터가 붙고 목록이 좁혀진다. 2페이지 이동 시 URL에 page=2가 붙고 목록이 갱신된다.",
    async () => {
      await login(page);
      await page.goto("/dashboard");
      const totalText = await page
        .getByText(/전체 \d+건 중 \d+건/)
        .first()
        .textContent();

      await page.getByPlaceholder("회사명 또는 직무 검색").fill("개발");
      await page.getByPlaceholder("회사명 또는 직무 검색").press("Enter");
      await page.waitForURL(/[?&]q=/);
      await expect(page.getByRole("heading", { name: "공고 목록" })).toBeVisible();

      // 검색어를 지워서 페이지네이션이 확실히 존재할 만큼 결과가 많은 상태로 되돌림
      await page.goto("/dashboard");
      const page2Link = page.getByRole("link", { name: "2", exact: true });
      const hasPage2 = (await page2Link.count()) > 0;
      let page2Confirmed = false;
      if (hasPage2) {
        await page2Link.click();
        await page.waitForURL(/[?&]page=2/);
        page2Confirmed = true;
      }

      const prevDisabled =
        (await page.getByRole("button", { name: "이전", disabled: true }).count()) > 0;

      return `검색 적용(이전: ${totalText?.trim()}), 2페이지 이동=${page2Confirmed}, 1페이지 이전버튼 비활성=${prevDisabled}`;
    }
  );
});
```
(의사코드 — Codex가 실제 파일의 기존 `runScenario`/`login` 헬퍼 시그니처에 맞게 다듬어라. 핵심은
`더 보기`/`cursor` 언급을 다 지우고, 실제로 2페이지가 있으면 이동까지 검증하고, 없으면 그 사실을
결과 문자열에 남기는 것 — 지금 운영 데이터는 1700건대라 페이지가 훨씬 많으니 사실상 항상
`hasPage2=true`일 것이다.)

## 검증

- `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm build` 통과.
- `pnpm test:e2e` 9/9 통과(특히 갱신한 시나리오 7이 실제로 2페이지 이동까지 검증하는지).

## 완료 시 보고

`artifacts/handover/<ts>-codex-e2e-and-768-grid-done.md`. main 병합·push는 하지 마라.
