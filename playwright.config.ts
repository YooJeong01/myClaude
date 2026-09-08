import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 240_000,
  expect: {
    timeout: 30_000
  },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure"
  },
  // 로컬 메모리 여유가 적어 dev 서버 대신 프로덕션 빌드를 쓴다.
  // 미리 `pnpm build` 후 실행할 것. reuseExistingServer 로 수동 기동한 서버도 재사용한다.
  webServer: {
    command: "cmd /c pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
