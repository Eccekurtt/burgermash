# --- Derleme aşaması ---
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# prisma generate + nest build
RUN npm run build

# --- Çalışma aşaması ---
FROM node:22-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
# Geliştirme bağımlılıkları da gerekli: migrate (prisma CLI) ve seed (tsx) çalışma anında kullanılır
RUN npm ci
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
# seed betiği üretilen Prisma istemcisini kullanır
COPY --from=build /app/src/generated ./src/generated
COPY prisma ./prisma
COPY prisma.config.ts ./
EXPOSE 4000
# Önce migrasyonlar, sonra (yalnızca boşsa) seed, sonra API
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
