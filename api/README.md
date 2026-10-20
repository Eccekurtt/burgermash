# BurgerMash API

NestJS 12 + Prisma 7 + PostgreSQL + socket.io. Kurulum, mimari ve testler için [kök README](../README.md).

```bash
npm install
npm run db:dev        # gömülü PostgreSQL (ayrı terminal)
cp .env.example .env
npm run db:migrate && npm run db:seed
npm run start:dev     # http://localhost:4000  (Swagger: /docs)
```

| Komut | Açıklama |
|---|---|
| `npm test` | Birim testleri (fiyatlandırma) |
| `npm run test:e2e` | API uçtan uca testleri (gerçek DB + WebSocket) |
| `npm run db:seed:force` | Menüyü varsayılana döndürür (admin değişikliklerini ezer) |
