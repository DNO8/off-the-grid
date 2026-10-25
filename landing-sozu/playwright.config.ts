import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const outputDir =
  process.env.TEST_OUTPUT_DIR ??
  mkdtempSync(path.join(tmpdir(), "web-apk-tests-"));
process.env.TEST_OUTPUT_DIR = outputDir;

export default defineConfig({
  testDir: "./tests",
  outputDir,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 20_000,
  expect: { timeout: 3_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    channel:
      process.env.PLAYWRIGHT_CHANNEL ??
      (process.platform === "win32" ? "msedge" : undefined),
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: {
    command: process.env.TEST_BUILD
      ? "npm run preview -- --port 4173 --strictPort"
      : "npm run dev -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
