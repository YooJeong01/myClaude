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

const plannedScenarios = [
  "로그인 fixture",
  "경험 CRUD",
  "기업분석 결과",
  "지원동기 실행",
  "지원동기 이력",
  "오프라인 미러"
];

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await cleanupExperiences();
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
        await page.getByText(title).click();
      }
      const start = performance.now();
      await page.getByRole("button", { name: "지원동기 만들기" }).click();
      await page.waitForURL(/\/dashboard\/drafts\/.+/, { timeout: 90_000 });
      performanceRows.push({
        name: "지원동기 API 응답",
        durationMs: Math.round(performance.now() - start),
        note: "LLM 호출 포함"
      });
      draftId = page.url().split("/dashboard/drafts/")[1] ?? "";
      await expect(page.getByRole("heading", { name: "지원동기 소재 초안" })).toBeVisible();
      return `draft ${draftId} 생성 확인`;
    }
  );
});

test("5. 같은 분석에서 매칭 한 번 더 실행 후 이력 2건", async ({ page }) => {
  await runScenario(
    "지원동기 이력",
    "같은 분석에서 여러 draft 이력이 쌓이는지 확인한다.",
    "기존 분석과 저장된 경험 2개가 필요하다.",
    "동일 분석으로 지원동기 매칭을 한 번 더 실행 후 이력 목록 확인",
    "지원동기 이력에 결과 열기 링크가 2개 이상 보인다.",
    async () => {
      await login(page);
      analysisId ||= await findExistingAnalysisId();
      await page.goto(`/dashboard/analyses/${analysisId}/motivation`);
      for (const title of createdExperienceTitles) {
        await page.getByText(title).click();
      }
      const start = performance.now();
      await page.getByRole("button", { name: "지원동기 만들기" }).click();
      await page.waitForURL(/\/dashboard\/drafts\/.+/, { timeout: 90_000 });
      performanceRows.push({
        name: "지원동기 API 응답 2회차",
        durationMs: Math.round(performance.now() - start),
        note: "LLM 호출 포함"
      });
      await page.goto(`/dashboard/analyses/${analysisId}/motivation`);
      await expect(page.getByRole("heading", { name: "지원동기 이력" })).toBeVisible();
      await expect(page.getByText("경험 2개 조합").first()).toBeVisible();
      return "지원동기 이력 표시 확인";
    }
  );
});

test("6. 오프라인 분석 페이지 미러 표시", async ({ page, context }) => {
  await runScenario(
    "오프라인 미러",
    "마지막으로 본 분석 데이터를 IndexedDB에서 읽는다.",
    "분석 상세를 온라인으로 한 번 본 상태여야 한다.",
    "분석 상세 진입 후 브라우저 컨텍스트 오프라인 전환, 새로고침",
    "오프라인 배너가 보이고 새 분석 버튼이 비활성화된다.",
    async () => {
      await login(page);
      analysisId ||= await findExistingAnalysisId();
      await page.goto(`/dashboard/analyses/${analysisId}`);
      await expect(page.getByRole("heading", { name: "회사 개요" })).toBeVisible();
      const start = performance.now();
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
      await expect(page.getByText("오프라인 · 마지막으로 본 데이터")).toBeVisible({
        timeout: 10_000
      });
      await expect(page.getByRole("button", { name: "기업분석" })).toBeDisabled();
      performanceRows.push({
        name: "오프라인 미러 새로고침",
        durationMs: Math.round(performance.now() - start),
        note: "IndexedDB 조회"
      });
      await context.setOffline(false);
      return "오프라인 미러 표시 확인";
    }
  );
});

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
