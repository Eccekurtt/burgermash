import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` veritabanına bağlanmaz; Docker build ve CI'da DATABASE_URL olmayabilir.
    // migrate/seed/uygulama gerçek adresi kendi ortamından alır (yoksa bağlantı hatası verir).
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
