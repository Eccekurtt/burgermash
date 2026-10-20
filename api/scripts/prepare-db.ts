/**
 * Test veritabanını hazırlar: (isteğe bağlı sıfırlar) oluşturur, migrasyonları uygular, seed eder.
 *   tsx scripts/prepare-db.ts <veritabanı-url> [--reset]
 * Hem API e2e testleri hem Playwright testleri bunu kullanır.
 * Önkoşul: PostgreSQL açık olmalı (npm run db:dev ya da CI'daki servis).
 */
import { execSync } from 'node:child_process';
import pg from 'pg';

export const TEST_ACCOUNTS = {
  SEED_ADMIN_EMAIL: 'admin@test.dev',
  SEED_ADMIN_PASSWORD: 'admin-pass-123',
  SEED_KITCHEN_EMAIL: 'kitchen@test.dev',
  SEED_KITCHEN_PASSWORD: 'kitchen-pass-123',
};

export async function prepareDatabase(url: string, opts: { reset?: boolean } = {}) {
  const dbName = new URL(url).pathname.slice(1);
  const client = new pg.Client({ connectionString: url.replace(/\/[^/]+$/, '/postgres') });
  await client.connect();
  if (opts.reset) await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!exists.rowCount) await client.query(`CREATE DATABASE "${dbName}"`);
  await client.end();

  const env = { ...process.env, ...TEST_ACCOUNTS, DATABASE_URL: url };
  // stderr görünür kalsın: CI'da hata nedeni gizlenmesin
  execSync('npx prisma migrate deploy', { env, stdio: ['ignore', 'ignore', 'inherit'] });
  execSync('npx prisma db seed', { env, stdio: ['ignore', 'ignore', 'inherit'] });
}

// CLI olarak çalıştırıldıysa
if (process.argv[1]?.endsWith('prepare-db.ts')) {
  const url = process.argv[2];
  if (!url) throw new Error('Kullanım: tsx scripts/prepare-db.ts <veritabanı-url> [--reset]');
  await prepareDatabase(url, { reset: process.argv.includes('--reset') });
  console.log(`Veritabanı hazır: ${new URL(url).pathname.slice(1)}`);
}
