# Profiler — image produksi (Next.js standalone + Prisma migrate saat start)
FROM node:22-bookworm-slim AS deps
WORKDIR /repo
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/prisma ./apps/web/prisma
COPY --from=build /repo/node_modules/prisma ./node_modules/prisma
COPY --from=build /repo/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /repo/node_modules/.prisma ./node_modules/.prisma
USER node
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --schema apps/web/prisma/schema.prisma && node apps/web/server.js"]
