import { defineConfig } from "@playwright/test";

/**
 * Uçtan uca testler ayrı portlarda ve ayrı bir veritabanında çalışır; geliştirme ortamıyla çakışmaz.
 *  - API:  http://localhost:4100  (veritabanı: burgermash_e2e, her çalıştırmada sıfırlanır)
 *  - Web:  http://localhost:3100  (ayrı derleme klasörü: .next-e2e)
 * Önkoşul: PostgreSQL açık olmalı (yerelde `npm run db:dev`, CI'da servis konteyneri).
 */
const API_PORT = 4100;
const WEB_PORT = 3100;
export const E2E_DB_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/burgermash_e2e";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Yerelde Windows'ta hazır gelen Edge kullanılır (ek indirme gerekmez); CI'da Chromium
    channel: process.env.CI ? undefined : "msedge",
    locale: "tr-TR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      // Playwright web sunucularını globalSetup'tan ÖNCE başlatır; bu yüzden veritabanı hazırlığı burada
      command: `npx tsx scripts/prepare-db.ts "${E2E_DB_URL}" --reset && npx prisma generate && npx tsc -p tsconfig.build.json --outDir dist-e2e && node dist-e2e/main.js`,
      cwd: "../api",
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        DATABASE_URL: E2E_DB_URL,
        JWT_SECRET: "e2e-secret",
        PORT: String(API_PORT),
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
        THROTTLE_DISABLED: "true",
      },
    },
    {
      command: `npm run build && npx next start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        NEXT_E2E: "1",
        NEXT_DIST_DIR: ".next-e2e",
        NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
      },
    },
  ],
});
