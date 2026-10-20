/**
 * Geliştirme için gömülü PostgreSQL (Docker gerekmez).
 *   npm run db:dev
 * Veri ./.pgdata klasöründe kalıcıdır. Ctrl+C ile durdurulur.
 */
import { existsSync } from 'node:fs';
import EmbeddedPostgres from 'embedded-postgres';

const port = Number(process.env.PGPORT ?? 5433);
const databaseDir = './.pgdata';
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres',
  port,
  persistent: true,
  initdbFlags: ['--locale=C', '--encoding=UTF8'],
});

if (!existsSync(`${databaseDir}/PG_VERSION`)) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase('burgermash');
} catch {
  // veritabanı zaten var
}
console.log(`PostgreSQL hazır: postgresql://postgres:postgres@localhost:${port}/burgermash`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
