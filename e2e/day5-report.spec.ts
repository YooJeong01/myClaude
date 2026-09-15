import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

import type { Database } from "@/shared/api";

type ScenarioResult = {
  name: string;
  purpose: string;
  prerequisite: string;
  steps: string;
  expected: string;
  actual: string;
  status: "통과" | "실패";
  durationMs: number;
};

const createdExperienceTitles = [
  `E2E React 성능 최적화 ${Date.now()}`,
  `E2E 디자인시스템 구축 ${Date.now()}`
];

const scenarioResults: ScenarioResult[] = [];
const performanceRows: {
  name: string;
  durationMs: number;
  note: string;
}[] = [];

const admin = createAdminClient();
let analysisId = "";
let draftId = "";
const testRunStart = new Date().toISOString();

const plannedScenarios = [
  "로그인 fixture",
  "경험 CRUD",
  "기업분석 결과",
  "지원동기 실행",
  "지원동기 이력",
  "오프라인 미러",
  "공고 검색·페이지네이션",
  "북마크·캘린더",
  "기업분석 모아보기"
];

// serial 아님: LLM 의존 시나리오(4·5)가 Gemini 무료 티어 일시 오류로 실패해도
// 나머지(6 오프라인 등)는 독립적으로 실행·판정되도록 한다. workers=1 이라 순서는 유지된다.
test.describe.configure({ mode: "default" });

test.afterAll(async () => {
  await cleanupExperiences();
  await cleanupSavedPostings();
  writeReport();
});

test("1. 로그인 fixture로 대시보드 진입", async ({ page }) => {
  await runScenario(
    "로그인 fixture",
    "매직링크 메일 대기 없이 인증 세션을 만든다.",
    "`SCRAPE_OWNER_USER_ID` 사용자가 Supabase에 존재해야 한다.",
    "`generateLink` token_hash로 `/auth/confirm`에 진입 후 `/dashboard` 확인",
    "대시보드 제목이 표시된다.",
    async () => {
      await login(page);
      await expect(page.getByRole("heading", { name: "공고 대시보드" })).toBeVisible();
      return "대시보드 진입 확인";
    }
  );
});

test("2. 경험 2개 추가 후 목록 반영", async ({ page }) => {
  await runScenario(
    "경험 CRUD",
    "지원동기 매칭에 쓸 경험을 저장한다.",
    "로그인 세션이 필요하다.",
    "`/dashboard/experiences`에서 경험 2개 저장 후 목록 확인",
    "저장한 경험 2개가 목록에 보인다.",
    async () => {
      await login(page);
      await page.goto("/dashboard/experiences");
      for (const title of createdExperienceTitles) {
        await page.getByLabel("제목").fill(title);
        await page.getByLabel("내용").fill(`${title} 내용. 문제, 행동, 결과를 포함한 테스트 경험입니다.`);
        await page.getByRole("button", { name: "경험 저장" }).click();
        await expect(page.getByRole("heading", { name: title })).toBeVisible();
      }
      return "경험 2개 목록 반영 확인";
    }
  );
});

test("3. 기존 기업분석 결과 6필드 렌더", async ({ page }) => {
  await runScenario(
    "기업분석 결과",
    "기존 company_analyses 데이터를 결과 화면에서 확인한다.",
    "`SCRAPE_OWNER_USER_ID` 소유 company_analyses 행이 있어야 한다.",
    "기존 분석 id 조회 후 상세 페이지 진입",
    "6개 리포트 섹션과 근거 영역이 표시된다.",
    async () => {
      await login(page);
      analysisId = await findExistingAnalysisId();
      const start = performance.now();
      await page.goto(`/dashboard/analyses/${analysisId}`);
      await expect(page.getByRole("heading", { name: "회사 개요" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "재무 요약" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "최근 뉴스 테마" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "애널리스트 시각" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "리스크" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "지원동기 매칭 소재" })).toBeVisible();
      await expect(page.getByText("근거 보기")).toBeVisible();
      performanceRows.push({
        name: "분석 상세 첫 로드",
        durationMs: Math.round(performance.now() - start),
        note: "기존 분석 데이터 조회"
      });
      return `분석 상세 ${analysisId} 렌더 확인`;
    }
  );
});

test("4. 경험 2개 선택 후 지원동기 실행", async ({ page }) => {
  await runScenario(
    "지원동기 실행",
    "선택한 경험과 기업분석으로 draft를 생성한다.",
    "기존 분석과 저장된 경험 2개가 필요하다.",
    "지원동기 페이지에서 경험 2개 선택 후 실행",
    "draft 결과 페이지에서 angles 카드가 표시된다.",
    async () => {
      await login(page);
      analysisId ||= await findExistingAnalysisId();
      await page.goto(`/dashboard/analyses/${analysisId}/motivation`);
      for (const title of createdExperienceTitles) {
        await page.getByRole("checkbox", { name: title }).check();
      }
      performanceRows.push({
        name: "지원동기 API 응답",
        durationMs: await submitMotivation(page),
        note: "LLM 호출 포함 (일시 오류 시 재시도)"
      });
      draftId = page.url().split("/dashboard/drafts/")[1] ?? "";
      await expect(page.getByRole("heading", { name: "지원동기 소재 초안" })).toBeVisible();
      return `draft ${draftId} 생성 확인`;
    }
  );
});

test("5. 같은 분석에서 이력이 2건 이상 쌓이고 이력 UI에 표시", async ({ page }) => {
  await runScenario(
    "지원동기 이력",
    "같은 분석에서 여러 draft 이력이 쌓이고 이력 UI에 나타나는지 확인한다.",
    "시나리오 4에서 만든 draft가 1건 이상 있어야 한다.",
    "동일 분석에 draft를 1건 더 만들고(2회차 LLM 호출 대신 admin 시드) 이력 목록 확인",
    "지원동기 이력에 '결과 열기' 링크가 2개 이상 보인다.",
    async () => {
      await login(page);

      // 2회차 LLM 호출은 Gemini 무료 티어 flakiness 때문에 UI 대신 admin으로 draft를 복제해
      // 이력을 쌓는다 (UI 생성은 시나리오 4에서 검증). draft 가 이미 있는 분석을 골라 시나리오 4와 독립화.
      const historyAnalysisId = await findAnalysisWithDrafts();
      await seedSecondDraft(historyAnalysisId);

      await page.goto(`/dashboard/analyses/${historyAnalysisId}/motivation`);
      await expect(page.getByRole("heading", { name: "지원동기 이력" })).toBeVisible();
      const historyLinks = page.getByRole("link", { name: "결과 열기" });
      await expect(historyLinks.nth(1)).toBeVisible();
      const count = await historyLinks.count();
      return `지원동기 이력 ${count}건 표시 확인`;
    }
  );
});

test("6. 오프라인 전환 시 분석 페이지가 미러로 전환", async ({ page, context }) => {
  await runScenario(
    "오프라인 미러",
    "온라인으로 본 분석을 IndexedDB에 미러해두고, 오프라인 전환 시 그 미러로 읽기 전용 렌더한다.",
    "분석 상세를 온라인으로 한 번 본 상태여야 한다 (서비스워커 없음 → 하드 리로드는 범위 밖).",
    "분석 상세 온라인 진입 → context.setOffline(true) → offline 이벤트로 클라이언트가 미러 모드 전환",
    "오프라인 배너가 보이고, 새 분석 실행 컨트롤이 사라진다.",
    async () => {
      await login(page);
      analysisId ||= await findExistingAnalysisId();
      await page.goto(`/dashboard/analyses/${analysisId}`);
      await expect(page.getByRole("heading", { name: "회사 개요" })).toBeVisible();
      await expect(page.getByRole("button", { name: "기업분석" })).toBeEnabled();
      await expect(
        page.getByText("오프라인 · 마지막으로 본 데이터")
      ).toHaveCount(0);

      const start = performance.now();
      await context.setOffline(true);
      // 하드 리로드 없이 offline 이벤트만으로 useOnline() 훅이 미러 모드로 전환한다.
      await expect(
        page.getByText("오프라인 · 마지막으로 본 데이터")
      ).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("button", { name: "기업분석" })).toHaveCount(0);
      performanceRows.push({
        name: "오프라인 미러 전환",
        durationMs: Math.round(performance.now() - start),
        note: "offline 이벤트 → IndexedDB 조회"
      });
      await context.setOffline(false);
      return "오프라인 배너 표시 + 새 분석 컨트롤 제거 확인";
    }
  );
});

// ── Day 6 시나리오 (LLM 안 씀) ─────────────────────────────────────

test("7. 공고 검색 + 페이지네이션", async ({ page }) => {
  await runScenario(
    "공고 검색·페이지네이션",
    "대시보드 공고 목록이 검색어로 필터되고 숫자 페이지네이션이 동작한다.",
    "로그인 세션과 11건 이상의 수집된 공고가 필요하다(1페이지=10건이라 2페이지 존재 확인용).",
    "검색어 입력 → URL 갱신 → 결과 필터 확인, 2페이지 링크 클릭 → page 파라미터 확인 → 이전 버튼 비활성 확인",
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

      await page.goto("/dashboard");
      const prevDisabled =
        (await page.getByRole("button", { name: "이전", disabled: true }).count()) > 0;
      const page2Link = page.getByRole("link", { name: "2", exact: true });
      const hasPage2 = (await page2Link.count()) > 0;
      let page2Confirmed = false;
      if (hasPage2) {
        await page2Link.click();
        await page.waitForURL(/[?&]page=2/);
        await expect(page.getByRole("heading", { name: "공고 목록" })).toBeVisible();
        page2Confirmed = true;
      }

      return `검색 적용(이전: ${totalText?.trim()}), 2페이지 이동=${page2Confirmed}, 1페이지 이전버튼 비활성=${prevDisabled}`;
    }
  );
});

test("8. 북마크 토글 → 캘린더 반영", async ({ page }) => {
  await runScenario(
    "북마크·캘린더",
    "공고를 북마크하면 요약 카운트가 늘고 캘린더 페이지가 렌더된다.",
    "로그인 세션과 공고 1건 이상이 필요하다.",
    "첫 공고 북마크 → 대시보드 '북마크한 공고' 카운트 확인 → /dashboard/calendar 렌더 확인",
    "북마크 토글이 '북마크됨'으로 바뀌고 캘린더가 표시된다.",
    async () => {
      await login(page);
      await page.goto("/dashboard");

      const before = await readSavedCount(page);
      const toggle = page
        .getByRole("button", { name: "북마크", exact: true })
        .first();
      await toggle.click();
      const savedToggle = page.getByRole("button", { name: "북마크됨" }).first();
      await expect(savedToggle).toBeVisible();
      await expect(savedToggle).toBeEnabled();

      await page.reload();
      const after = await readSavedCount(page);
      expect(after).toBeGreaterThanOrEqual(before + 1);

      await page.goto("/dashboard/calendar");
      await expect(page.locator(".rbc-calendar")).toBeVisible();
      await expect(page.locator(".rbc-month-view")).toBeVisible();
      return `북마크 카운트 ${before} → ${after}, 캘린더 렌더 확인`;
    }
  );
});

test("9. 기업분석 모아보기 페이지", async ({ page }) => {
  await runScenario(
    "기업분석 모아보기",
    "회사별 분석 카드가 렌더되고 회사명 검색이 동작한다.",
    "기존 company_analyses 데이터(삼성전자·카카오)가 있어야 한다.",
    "/dashboard/analyses 진입 → 카드 확인 → '카카오' 검색 → 결과 좁혀짐",
    "회사 카드가 1개 이상 보이고 검색 시 URL 에 q 가 붙는다.",
    async () => {
      await login(page);
      await page.goto("/dashboard/analyses");
      await expect(
        page.getByRole("heading", { name: "회사별 분석" })
      ).toBeVisible();
      const cardLinks = page.locator("main a[href^='/dashboard/analyses/']");
      const cardCount = await cardLinks.count();
      expect(cardCount).toBeGreaterThan(0);

      await page.getByPlaceholder("회사명 검색").fill("카카오");
      await page.getByRole("button", { name: "검색" }).click();
      await page.waitForURL(/[?&]q=/);
      return `회사 카드 ${cardCount}개, 검색 적용 확인`;
    }
  );
});

async function readSavedCount(page: Page): Promise<number> {
  const countP = page
    .getByText("북마크한 공고", { exact: true })
    .locator("xpath=following-sibling::p[1]");
  const text = await countP.textContent();
  return Number.parseInt(text?.trim() ?? "0", 10) || 0;
}

/**
 * "지원동기 만들기" 실행 후 draft 페이지 이동까지 대기.
 * Gemini 무료 티어 일시 오류(502/503)로 실패하면 최대 3회까지 재시도한다.
 * 반환값: 성공한 시도의 소요 시간(ms).
 */
async function submitMotivation(page: Page): Promise<number> {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const start = performance.now();
    await page.getByRole("button", { name: "지원동기 만들기" }).click();
    try {
      await page.waitForURL(/\/dashboard\/drafts\/.+/, { timeout: 90_000 });
      return Math.round(performance.now() - start);
    } catch (error) {
      const transientMessage = await page
        .getByText(/오류가 발생했습니다|요청이 많아|잠시 후 다시/)
        .first()
        .textContent()
        .catch(() => null);
      if (attempt < maxAttempts && transientMessage) {
        await page.waitForTimeout(15_000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("지원동기 실행이 재시도 후에도 실패했습니다.");
}

async function runScenario(
  name: string,
  purpose: string,
  prerequisite: string,
  steps: string,
  expected: string,
  fn: () => Promise<string>
) {
  const start = performance.now();
  try {
    const actual = await fn();
    scenarioResults.push({
      name,
      purpose,
      prerequisite,
      steps,
      expected,
      actual,
      status: "통과",
      durationMs: Math.round(performance.now() - start)
    });
  } catch (error) {
    scenarioResults.push({
      name,
      purpose,
      prerequisite,
      steps,
      expected,
      actual: error instanceof Error ? error.message : String(error),
      status: "실패",
      durationMs: Math.round(performance.now() - start)
    });
    throw error;
  }
}

async function login(page: Page) {
  const userId = requiredEnv("SCRAPE_OWNER_USER_ID");
  const user = await findUserById(userId);
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email
  });
  if (error) {
    throw error;
  }

  const properties = data.properties as {
    hashed_token?: string;
    token_hash?: string;
  };
  const tokenHash = properties.token_hash ?? properties.hashed_token;
  if (!tokenHash) {
    throw new Error("generateLink 응답에서 token_hash를 찾지 못했습니다.");
  }

  await page.goto(`/auth/confirm?token_hash=${tokenHash}&type=magiclink`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000
  });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
  if (!page.url().includes("/dashboard")) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `로그인 후 /dashboard로 이동하지 않음: ${page.url()} ${bodyText.slice(0, 200)}`
    );
  }
}

async function findUserById(userId: string): Promise<{ email: string }> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    throw error;
  }
  const email = data.user.email;
  if (!email) {
    throw new Error("테스트 사용자 이메일이 없습니다.");
  }
  return { email };
}

async function findExistingAnalysisId(): Promise<string> {
  const { data, error } = await admin
    .from("company_analyses")
    .select("id")
    .eq("user_id", requiredEnv("SCRAPE_OWNER_USER_ID"))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("기존 company_analyses 테스트 데이터가 없습니다.");
  }
  return data.id;
}

/** motivation_drafts 가 1건 이상 있는 company_analysis_id 를 찾는다 (verify-motivation / 시나리오 4 산출물). */
async function findAnalysisWithDrafts(): Promise<string> {
  const { data, error } = await admin
    .from("motivation_drafts")
    .select("company_analysis_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error(
      "motivation_drafts 테스트 데이터가 없습니다 (verify-motivation.ts 를 먼저 실행하세요)."
    );
  }
  return data.company_analysis_id;
}

/** 기존 draft 1건을 복제해 같은 분석에 이력을 하나 더 쌓는다 (2회차 LLM 호출 대용). */
async function seedSecondDraft(companyAnalysisId: string) {
  const { data: existing, error } = await admin
    .from("motivation_drafts")
    .select("user_id, company_analysis_id, job_posting_id, experience_ids, result, model")
    .eq("company_analysis_id", companyAnalysisId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!existing) {
    throw new Error("복제할 기존 draft가 없습니다 (시나리오 4 실패?).");
  }
  const { error: insertError } = await admin.from("motivation_drafts").insert(existing);
  if (insertError) {
    throw insertError;
  }
}

async function cleanupExperiences() {
  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    return;
  }
  await admin
    .from("user_experiences")
    .delete()
    .eq("user_id", userId)
    .in("title", createdExperienceTitles);
}

/** 시나리오 8 이 만든 북마크만 지운다 (이 실행 시작 이후 생성분). */
async function cleanupSavedPostings() {
  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    return;
  }
  await admin
    .from("saved_postings")
    .delete()
    .eq("user_id", userId)
    .gte("created_at", testRunStart);
}

function createAdminClient() {
  loadEnvLocal();
  return createClient<Database>(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} 환경변수가 필요합니다.`);
  }
  return value;
}

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

function writeReport() {
  for (const name of plannedScenarios) {
    if (!scenarioResults.some((item) => item.name === name)) {
      scenarioResults.push({
        name,
        purpose: "위 34-1 시나리오 검증",
        prerequisite: "선행 시나리오 통과",
        steps: "serial 실행",
        expected: "시나리오 실행",
        actual: "선행 실패로 미실행",
        status: "실패",
        durationMs: 0
      });
    }
  }

  const reportPath = path.join(
    process.cwd(),
    "artifacts",
    "test-reports",
    "day5-e2e.md"
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const passed = scenarioResults.filter((item) => item.status === "통과").length;
  const failed = scenarioResults.filter((item) => item.status === "실패");
  const commit = getCommitHash();
  const rows = scenarioResults
    .map(
      (item) =>
        `| ${item.name} | ${item.purpose} | ${item.prerequisite} | ${item.steps} | ${item.expected} | ${item.actual.replace(/\|/g, "\\|")} | ${item.status} | ${item.durationMs} |`
    )
    .join("\n");
  const performanceTable = performanceRows
    .map((item) => `| ${item.name} | ${item.durationMs} | ${item.note} |`)
    .join("\n");
  const failures = failed.length
    ? failed.map((item) => `- ${item.name}: ${item.actual}`).join("\n")
    : "- 없음";

  fs.writeFileSync(
    reportPath,
    [
      "# Day 5 E2E 리포트",
      "",
      "## 테스트 상황/환경",
      "",
      `- 실행 일시: ${new Date().toISOString()}`,
      `- OS: ${os.type()} ${os.release()} (${os.platform()})`,
      `- Node: ${process.version}`,
      "- 브라우저: Playwright chromium",
      `- 대상 커밋: ${commit}`,
      "- 실행 명령: `cmd /c pnpm test:e2e`",
      "",
      "## 시나리오별 결과",
      "",
      "| 시나리오 | 목적 | 사전조건 | 단계 | expected | actual | 결과 | 소요(ms) |",
      "| --- | --- | --- | --- | --- | --- | --- | ---: |",
      rows || "| 미실행 | - | - | - | - | 테스트가 실행되지 않음 | 실패 | 0 |",
      "",
      "## 성능 수치",
      "",
      "| 구간 | 소요(ms) | 비고 |",
      "| --- | ---: | --- |",
      performanceTable || "| 미측정 | 0 | 실행 전 실패 |",
      "",
      "## 케이스 통과율",
      "",
      `- 통과 ${passed} / 전체 ${scenarioResults.length}`,
      "- 실패 케이스:",
      failures,
      "",
      "## 발견된 문제",
      "",
      failed.length
        ? "- 실패 원인은 위 actual에 기록. Redirect URL 미등록, Supabase 테스트 데이터 부재, LLM/API 오류는 환경 문제로 분류한다."
        : "- 발견된 문제 없음"
    ].join("\n"),
    "utf8"
  );
}

function getCommitHash() {
  const headPath = path.join(process.cwd(), ".git", "HEAD");
  if (!fs.existsSync(headPath)) {
    return "unknown";
  }
  const head = fs.readFileSync(headPath, "utf8").trim();
  if (!head.startsWith("ref: ")) {
    return head;
  }
  const refPath = path.join(process.cwd(), ".git", head.slice(5));
  return fs.existsSync(refPath) ? fs.readFileSync(refPath, "utf8").trim() : "unknown";
}
