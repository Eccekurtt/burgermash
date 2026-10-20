import { TEST_ACCOUNTS, prepareDatabase } from '../scripts/prepare-db.js';

/**
 * E2E testleri ayrı bir veritabanında (burgermash_test) çalışır; geliştirme verisine dokunmaz.
 * Önkoşul: PostgreSQL açık olmalı (npm run db:dev).
 */
export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/burgermash_test';

export const TEST_ENV = {
  DATABASE_URL: TEST_DB_URL,
  JWT_SECRET: 'test-secret',
  CORS_ORIGINS: 'http://localhost:3000',
  THROTTLE_DISABLED: 'true',
  ...TEST_ACCOUNTS,
};

export default async function setup() {
  await prepareDatabase(TEST_DB_URL, { reset: true }); // her çalıştırmada temiz veritabanı
}
