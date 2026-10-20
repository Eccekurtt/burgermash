# BurgerMash Web

Next.js 16 ön yüzü. Kurulum, mimari ve testler için [kök README](../README.md).

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

| Komut | Açıklama |
|---|---|
| `npm run lint` / `npm run typecheck` | Kod ve tip denetimi |
| `npm run test:e2e` | Playwright uçtan uca testleri (kendi API + web sunucusunu başlatır) |
