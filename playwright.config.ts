import { defineConfig, devices } from "@playwright/test";

const e2eApiPort = 3102;
const e2eWebPort = 5274;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${e2eWebPort}`,
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "npm run dev:api",
      url: `http://127.0.0.1:${e2eApiPort}/api/health`,
      env: {
        PORT: String(e2eApiPort)
      },
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: "npm run dev:web",
      url: `http://127.0.0.1:${e2eWebPort}`,
      env: {
        CURADH_WEB_PORT: String(e2eWebPort),
        CURADH_API_PORT: String(e2eApiPort)
      },
      reuseExistingServer: false,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
